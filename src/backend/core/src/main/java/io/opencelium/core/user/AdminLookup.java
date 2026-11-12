package io.opencelium.core.user;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Projections;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;

/**
 * Whether a database holds an admin of a tenant, read with the plain driver and a client of its own: the setup wizard
 * asks this before Spring starts, so it has no repository. A tenant with an admin gets no second one from the setup.
 * The query is that of {@link UserService#adminExists}.
 */
public final class AdminLookup {

	private AdminLookup() {
	}

	/**
	 * @throws com.mongodb.MongoException when the server does not answer within the timeout of the startup ping, or
	 *                                    refuses the read
	 */
	public static boolean exists(MongoConnection connection, TenantId tenant) {
		try (MongoClient client = MongoClients.create(MongoStartupPing.checkSettings(connection))) {
			return client.getDatabase(connection.databaseName()).getCollection(UserDocument.COLLECTION)
					.find(Filters.and(Filters.eq(UserDocument.TENANT_ID, tenant.value()),
							Filters.eq(UserDocument.ROLES, UserService.ADMIN_ROLE)))
					.projection(Projections.include("_id")).limit(1).first() != null;
		}
	}

}
