package io.opencelium.core.tenant;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.mongo.MongoClientFactory;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoConnectionResolver;

import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The 1 path from a repository to its tenant documents. A repository gives the document type and a condition without
 * a tenant; each operation then works on the documents of the current tenant only:
 * <ol>
 * <li>It reads the current tenant first. Work without one stops with {@link NoCurrentTenantException} before a query
 * goes to MongoDB; no default tenant takes its place.</li>
 * <li>It asks the connection resolver for the database of that tenant. A tenant without a database stops with the
 * error of the resolver, so that a tenant document never lands in the database of another tenant or in the system
 * database.</li>
 * <li>It adds "the field {@value TenantDocument#TENANT_ID} holds the current tenant" to each read, change and delete.
 * A document of another tenant thus looks like a document that does not exist.</li>
 * <li>It refuses a new document of another tenant or of no tenant, and a change of the field
 * {@value TenantDocument#TENANT_ID}, so that a document never moves to another tenant.</li>
 * </ol>
 * The templates of this class are not Spring beans: entity callbacks and mapping events of Spring Data do not run for
 * tenant documents. A feature that needs them, for example auditing, gives the templates the application context
 * here.
 */
@Component
public final class TenantDocuments {

	private static final String RENAME = "$rename";

	private final CurrentTenant currentTenant;

	private final MongoConnectionResolver connections;

	private final MongoClientFactory clients;

	/** 1 template for each database; tenants on the same cluster share the client of the factory. */
	private final Map<MongoConnection, MongoTemplate> templates = new ConcurrentHashMap<>();

	TenantDocuments(CurrentTenant currentTenant, MongoConnectionResolver connections, MongoClientFactory clients) {
		this.currentTenant = currentTenant;
		this.connections = connections;
		this.clients = clients;
	}

	/** The first document of the current tenant that matches the condition. */
	public <T extends TenantDocument> Optional<T> findOne(Class<T> type, Criteria condition) {
		Scope scope = scope(condition);
		return Optional.ofNullable(scope.template().findOne(scope.query(), type));
	}

	/** Each document of the current tenant that matches the condition. */
	public <T extends TenantDocument> List<T> find(Class<T> type, Criteria condition) {
		Scope scope = scope(condition);
		return scope.template().find(scope.query(), type);
	}

	/** The number of documents of the current tenant that match the condition. */
	public long count(Class<? extends TenantDocument> type, Criteria condition) {
		Scope scope = scope(condition);
		return scope.template().count(scope.query(), type);
	}

	/**
	 * Stores a new document of the current tenant.
	 *
	 * @return the stored document, with the ID that the database gave it
	 * @throws IllegalArgumentException when the document holds no tenant, or a tenant other than the current one
	 */
	public <T extends TenantDocument> T insert(T document) {
		Objects.requireNonNull(document, "document");
		TenantId tenant = currentTenant.get();
		String type = document.getClass().getSimpleName();
		if (document.tenantId() == null) {
			throw new IllegalArgumentException("Cannot insert a " + type + " with no tenant: it must hold the current"
					+ " tenant '" + tenant + "'.");
		}
		if (!document.tenantId().equals(tenant.value())) {
			throw new IllegalArgumentException("Cannot insert a " + type + " of the tenant '" + document.tenantId()
					+ "': the current tenant is '" + tenant + "'.");
		}
		return templateOf(tenant).insert(document);
	}

	/**
	 * Changes each document of the current tenant that matches the condition.
	 *
	 * @return the number of documents that match the condition, also the ones that held the new values already
	 * @throws IllegalArgumentException when the change sets, removes or renames the field
	 *                                  {@value TenantDocument#TENANT_ID}, or renames another field to it
	 */
	public long update(Class<? extends TenantDocument> type, Criteria condition, Update change) {
		Objects.requireNonNull(change, "change");
		Scope scope = scope(condition);
		if (changesTenantId(change)) {
			throw new IllegalArgumentException("Cannot change the field " + TenantDocument.TENANT_ID + " of a "
					+ type.getSimpleName() + ": a document stays with its tenant.");
		}
		return scope.template().updateMulti(scope.query(), change, type).getMatchedCount();
	}

	/**
	 * Deletes each document of the current tenant that matches the condition.
	 *
	 * @return the number of deleted documents
	 */
	public long delete(Class<? extends TenantDocument> type, Criteria condition) {
		Scope scope = scope(condition);
		return scope.template().remove(scope.query(), type).getDeletedCount();
	}

	/** The database of the current tenant and the condition limited to that tenant. */
	private Scope scope(Criteria condition) {
		Objects.requireNonNull(condition, "condition");
		TenantId tenant = currentTenant.get();
		// The condition stays a separate clause: a tenant ID in it can narrow the result, never widen it.
		Query query = new Query(where(TenantDocument.TENANT_ID).is(tenant.value()).andOperator(condition));
		return new Scope(templateOf(tenant), query);
	}

	/**
	 * Reads the change as the driver sends it, not only the keys that {@link Update#modifies} knows: a change made from
	 * a document can hold a plain map for an operator, and its keys are then not known. Each key under an operator
	 * names a field that the operator sets, removes or renames; a rename names the new field in its value.
	 */
	private static boolean changesTenantId(Update change) {
		if (change.modifies(TenantDocument.TENANT_ID)) {
			return true;
		}
		for (Map.Entry<String, Object> operation : change.getUpdateObject().entrySet()) {
			if (operation.getValue() instanceof Map<?, ?> fields) {
				boolean rename = operation.getKey().equals(RENAME);
				for (Map.Entry<?, ?> field : fields.entrySet()) {
					if (namesTenantId(field.getKey()) || rename && namesTenantId(field.getValue())) {
						return true;
					}
				}
			}
		}
		return false;
	}

	/** The field of the tenant ID, or a path inside it. */
	private static boolean namesTenantId(Object field) {
		return field instanceof String name
				&& (name.equals(TenantDocument.TENANT_ID) || name.startsWith(TenantDocument.TENANT_ID + "."));
	}

	private MongoTemplate templateOf(TenantId tenant) {
		return templates.computeIfAbsent(connections.resolve(tenant), connection -> new MongoTemplate(
				new SimpleMongoClientDatabaseFactory(clients.clientFor(connection), connection.databaseName())));
	}

	private record Scope(MongoTemplate template, Query query) {
	}

}
