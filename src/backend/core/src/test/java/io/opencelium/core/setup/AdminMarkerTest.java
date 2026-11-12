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
 * The admin marker is an action of the file plan: after the files are written, it stores the admin username in the
 * collection {@code admin_marker}, with the plain driver and without a Spring context, because the wizard writes it
 * before the application starts. A rollback of the plan puts back what was there before.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class AdminMarkerTest {

	private static final String URI = LocalMongo.uriFor(AdminMarkerTest.class);

	private static final MongoConnection CONNECTION = StaticMongoConnectionResolver.parseUri(URI);

	@BeforeEach
	void emptyMarkerCollection() {
		try (MongoClient client = client()) {
			markers(client).drop();
		}
	}

	@Test
	void runStoresTheMarkerWithTheUsername() {
		new AdminMarker(CONNECTION, "root").run();

		assertThat(marker()).isEqualTo(new Document("_id", "self-host").append("adminUsername", "root"));
	}

	@Test
	void descriptionNamesTheMarkerAndTheAdminUsernameWithoutTheDatabasePassword() {
		// The summary prints the description of each action, and the summary never shows the database password.
		var marker = new AdminMarker(StaticMongoConnectionResolver.parseUri("mongodb://oc:s3cret@localhost:1/opencelium"),
				"root");

		assertThat(marker.description()).contains("admin marker", "'root'").doesNotContain("s3cret");
	}

	@Test
	void undoRemovesTheMarkerWhenNoMarkerExistedBefore() {
		var marker = new AdminMarker(CONNECTION, "root");
		marker.run();
		assertThat(marker()).containsEntry("adminUsername", "root");

		assertThat(marker.undo()).isEmpty();
		assertThat(marker()).isNull();
	}

	@Test
	void undoPutsBackTheMarkerThatExistedBefore() {
		// The marker of an earlier setup run whose start did not run yet.
		Document before = new Document("_id", "self-host").append("adminUsername", "admin");
		try (MongoClient client = client()) {
			markers(client).insertOne(before);
		}
		var marker = new AdminMarker(CONNECTION, "root");
		marker.run();
		assertThat(marker()).containsEntry("adminUsername", "root");

		assertThat(marker.undo()).isEmpty();
		assertThat(marker()).isEqualTo(before);
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

	private static Document marker() {
		try (MongoClient client = client()) {
			return markers(client).find(new Document("_id", "self-host")).first();
		}
	}

	/** Gives up after 5 s when the server is gone, as the setup ping does. */
	private static MongoClient client() {
		return MongoClients.create(MongoClientSettings.builder().applyConnectionString(new ConnectionString(URI))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build());
	}

	private static MongoCollection<Document> markers(MongoClient client) {
		return client.getDatabase(LocalMongo.databaseFor(AdminMarkerTest.class)).getCollection("admin_marker");
	}

}
