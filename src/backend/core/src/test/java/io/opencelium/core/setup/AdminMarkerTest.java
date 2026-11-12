package io.opencelium.core.setup;

import java.util.concurrent.TimeUnit;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.setup.files.SetupActionException;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The admin marker is an action of the file plan: after the files are written, it stores the setup state
 * {@code PENDING_ADMIN} with the admin username, with the plain driver and without a Spring context, because the
 * wizard writes it before the application starts. A rollback of the plan puts back what was there before.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class AdminMarkerTest {

	private static final String URI = LocalMongo.uriFor(AdminMarkerTest.class);

	private static final MongoConnection CONNECTION = StaticMongoConnectionResolver.parseUri(URI);

	@BeforeEach
	void emptySetupStateCollection() {
		try (MongoClient client = client()) {
			setupState(client).drop();
		}
	}

	@Test
	void runStoresStatePendingAdminWithUsername() {
		new AdminMarker(CONNECTION, "root").run();

		Document state = state();
		assertThat(state).isNotNull();
		assertThat(state.getString("_id")).isEqualTo("self-host");
		assertThat(state.getString("state")).isEqualTo("PENDING_ADMIN");
		assertThat(state.getString("adminUsername")).isEqualTo("root");
	}

	@Test
	void descriptionNamesTheMarkerAndTheAdminUsernameWithoutTheDatabasePassword() {
		// The summary prints the description of each action, and the summary never shows the database password.
		var marker = new AdminMarker(StaticMongoConnectionResolver.parseUri("mongodb://oc:s3cret@localhost:1/opencelium"),
				"root");

		assertThat(marker.description()).contains("admin marker", "'root'").doesNotContain("s3cret");
	}

	@Test
	void undoRemovesTheMarkerWhenNoSetupStateExistedBefore() {
		var marker = new AdminMarker(CONNECTION, "root");
		marker.run();

		assertThat(marker.undo()).isEmpty();
		assertThat(state()).isNull();
	}

	@Test
	void undoPutsBackTheSetupStateThatExistedBefore() {
		Document before = new Document("_id", "self-host").append("state", "REQUIRED");
		try (MongoClient client = client()) {
			setupState(client).insertOne(before);
		}
		var marker = new AdminMarker(CONNECTION, "root");
		marker.run();

		assertThat(marker.undo()).isEmpty();
		assertThat(state()).isEqualTo(before);
	}

	@Test
	void runStopsNamingTheServerWithoutTheDatabasePasswordWhenNoDatabaseAnswers() {
		var marker = new AdminMarker(StaticMongoConnectionResolver.parseUri("mongodb://oc:s3cret@localhost:1/opencelium"),
				"root");

		SetupActionException ex = assertThatExceptionOfType(SetupActionException.class).isThrownBy(marker::run)
				.actual();

		assertThat(ex.getMessage()).contains("admin marker", "mongodb://oc:****@localhost:1/opencelium")
				.doesNotContain("s3cret");
	}

	private static Document state() {
		try (MongoClient client = client()) {
			return setupState(client).find(new Document("_id", "self-host")).first();
		}
	}

	/** Gives up after 5 s when the server is gone, as the setup ping does. */
	private static MongoClient client() {
		return MongoClients.create(MongoClientSettings.builder().applyConnectionString(new ConnectionString(URI))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build());
	}

	private static MongoCollection<Document> setupState(MongoClient client) {
		return client.getDatabase(LocalMongo.databaseFor(AdminMarkerTest.class)).getCollection("setup_state");
	}

}
