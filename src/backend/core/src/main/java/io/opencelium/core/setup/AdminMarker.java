package io.opencelium.core.setup;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

import org.bson.Document;
import org.bson.conversions.Bson;

import com.mongodb.MongoException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.ReplaceOptions;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.files.SetupActionException;

/**
 * The handover from the wizard to the application: after the files are written, this action stores the setup state
 * {@code PENDING_ADMIN} with the admin username in the database. Each process that starts the application finds it
 * and makes the admin, also a service that starts in another process, and also the start after a failed one. The
 * marker holds no secret. It is written with the plain driver and a client of its own, because Spring has not
 * started yet; it takes the place of a setup state that exists, and the undo puts that one back.
 */
public final class AdminMarker implements PlannedAction {

	/** The wizard installs the self-host mode only, with its 1 tenant. */
	private static final TenantId TENANT = TenantId.SELF_HOST;

	private final MongoConnection connection;

	private final String adminUsername;

	private boolean written;

	/** The setup state that the marker took the place of; null when there was none. */
	private Document replaced;

	/**
	 * @param connection    the database that the MongoDB step chose
	 * @param adminUsername the username of the admin that the start makes
	 */
	public AdminMarker(MongoConnection connection, String adminUsername) {
		this.connection = Objects.requireNonNull(connection, "connection");
		this.adminUsername = Objects.requireNonNull(adminUsername, "adminUsername");
	}

	@Override
	public String description() {
		return "Write the admin marker into MongoDB: the start makes the admin '" + adminUsername
				+ "' with the admin password " + SetupContext.FIRST_ADMIN_PASSWORD;
	}

	@Override
	public List<PlannedFile> files() {
		return List.of();
	}

	@Override
	public void run() {
		try (MongoClient client = client()) {
			MongoCollection<Document> states = states(client);
			replaced = states.find(id()).first();
			states.replaceOne(id(), new Document(SetupStateDocument.ID, TENANT.value())
					.append(SetupStateDocument.STATE, SetupState.PENDING_ADMIN.name())
					.append(SetupStateDocument.ADMIN_USERNAME, adminUsername), new ReplaceOptions().upsert(true));
			written = true;
		}
		catch (MongoException ex) {
			// Not the driver's message: it can quote the connection string.
			throw new SetupActionException("Cannot write the admin marker to MongoDB at " + connection.redacted()
					+ ": " + ex.getClass().getSimpleName() + ".");
		}
	}

	/** Puts back the setup state that the marker took the place of, or removes the marker when there was none. */
	@Override
	public Optional<String> undo() {
		if (!written) {
			return Optional.empty();
		}
		try (MongoClient client = client()) {
			MongoCollection<Document> states = states(client);
			if (replaced == null) {
				states.deleteOne(id());
			}
			else {
				states.replaceOne(id(), replaced);
			}
			written = false;
			return Optional.empty();
		}
		catch (MongoException ex) {
			return Optional.of("Cannot remove the admin marker from MongoDB at " + connection.redacted()
					+ "; please check the document '" + TENANT + "' of the collection " + SetupStateDocument.COLLECTION
					+ " by hand.");
		}
	}

	/** The timeout of the startup ping, not the driver's 30 seconds. */
	private MongoClient client() {
		return MongoClients.create(MongoStartupPing.checkSettings(connection));
	}

	private MongoCollection<Document> states(MongoClient client) {
		return client.getDatabase(connection.databaseName()).getCollection(SetupStateDocument.COLLECTION);
	}

	private static Bson id() {
		return Filters.eq(SetupStateDocument.ID, TENANT.value());
	}

}
