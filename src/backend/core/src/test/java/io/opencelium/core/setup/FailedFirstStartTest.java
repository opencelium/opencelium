package io.opencelium.core.setup;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;

import io.opencelium.core.secrets.keys.KeyStartupException;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * The first start of the application after the wizard can fail, for example on the master key. The admin marker then
 * stays, so the next start makes the admin. The test starts the real application, as {@code java -jar} would. An
 * encrypted data key without a master key stops the start after MongoDB answers and before the runners.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class FailedFirstStartTest {

	private static final String URI = LocalMongo.uriFor(FailedFirstStartTest.class);

	@TempDir
	Path dataDir;

	@BeforeEach
	void emptyCollections() {
		try (MongoClient client = client()) {
			for (String collection : List.of("admin_marker", "users", "keys")) {
				database(client).getCollection(collection).drop();
			}
		}
	}

	@Test
	void nextStartMakesTheAdminWhenTheFirstStartFailed() {
		storeMarker("root");
		storeWrappedDek();

		assertThatThrownBy(this::start).hasStackTraceContaining(KeyStartupException.class.getName());

		// The failed start keeps the marker and makes no admin.
		Document kept = marker();
		assertThat(kept.getString("adminUsername")).isEqualTo("root");
		assertThat(userCount()).isZero();
		// The operator removes the cause of the failure, then starts again.
		try (MongoClient client = client()) {
			database(client).getCollection("keys").drop();
		}

		start();

		assertThat(marker()).isNull();
		assertThat(userCount()).isEqualTo(1);
	}

	private void start() {
		CoreStartup.run(Map.of(), dataDir, CoreStartup.mongoUri(URI)).close();
	}

	/** The marker as the wizard writes it before Spring starts. */
	private static void storeMarker(String adminUsername) {
		try (MongoClient client = client()) {
			database(client).getCollection("admin_marker")
					.insertOne(new Document("_id", "self-host").append("adminUsername", adminUsername));
		}
	}

	/** A document in the place of a wrapped data key: without a master key the start stops on it. */
	private static void storeWrappedDek() {
		try (MongoClient client = client()) {
			database(client).getCollection("keys").insertOne(new Document("tenantId", "self-host")
					.append("rootKeyId", "k-01"));
		}
	}

	private static Document marker() {
		try (MongoClient client = client()) {
			return database(client).getCollection("admin_marker").find(new Document("_id", "self-host")).first();
		}
	}

	private static long userCount() {
		try (MongoClient client = client()) {
			return database(client).getCollection("users").countDocuments();
		}
	}

	/** Gives up after 5 s when the server is gone, as the setup ping does. */
	private static MongoClient client() {
		return MongoClients.create(MongoClientSettings.builder().applyConnectionString(new ConnectionString(URI))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build());
	}

	private static MongoDatabase database(MongoClient client) {
		return client.getDatabase(LocalMongo.databaseFor(FailedFirstStartTest.class));
	}

}
