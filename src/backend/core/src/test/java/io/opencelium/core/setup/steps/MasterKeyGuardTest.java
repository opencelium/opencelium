package io.opencelium.core.setup.steps;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
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
import com.mongodb.client.MongoCollection;

import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.secrets.keys.KeyStartupException;
import io.opencelium.core.secrets.keys.RootKeyResolver;
import io.opencelium.core.secrets.keys.WrappedDek;
import io.opencelium.core.secrets.keys.WrappedDekProbe;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The guard before the master key menu reads the database that the MongoDB step chose, with the plain driver and
 * without a Spring context, because it runs before Spring starts. A database with an encrypted data key and no
 * master key stops the setup with the restore-or-reset text; a database that does not answer stops it too.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class MasterKeyGuardTest {

	private static final String URI = LocalMongo.uriFor(MasterKeyGuardTest.class);

	@TempDir
	Path dataDir;

	private final Map<String, String> environment = new HashMap<>();

	@BeforeEach
	void emptyKeysCollection() {
		try (MongoClient client = client()) {
			keys(client).drop();
		}
	}

	@Test
	void runStopsWithRestoreOrResetWhenDekExistsAndNoKeyResolves() {
		storeWrappedDek();

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> guard().run(URI, dataDir)).actual();

		assertThat(ex.getMessage()).startsWith(KeyStartupException.RESTORE_OR_RESET)
				.contains(RootKeyResolver.ENV_VARIABLE, dataDir.resolve("master.key").toString());
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void runReportsDataKeysWhenDekExistsAndKeyResolves() throws Exception {
		storeWrappedDek();
		Files.writeString(dataDir.resolve("master.key"), randomKey());

		assertThat(guard().run(URI, dataDir)).isTrue();
	}

	@Test
	void runReportsDataKeysWhenDekExistsAndTheVariableHoldsTheKey() {
		storeWrappedDek();
		environment.put(RootKeyResolver.ENV_VARIABLE, randomKey());

		assertThat(guard().run(URI, dataDir)).isTrue();
	}

	@Test
	void runReportsNoDataKeysWhenNoDekExists() {
		assertThat(guard().run(URI, dataDir)).isFalse();
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void runStopsWithTheProblemWhenTheVariableIsNotAMasterKey() {
		environment.put(RootKeyResolver.ENV_VARIABLE, "not*a*key");

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> guard().run(URI, dataDir)).actual();

		assertThat(ex.getMessage()).contains("OC_MASTER_KEY is not valid base64").doesNotContain("not*a*key");
		assertThat(ex.exitCode()).isEqualTo(1);
	}

	@Test
	void runStopsNamingTheServerWhenNoDatabaseAnswers() {
		var guard = new MasterKeyGuard(connection -> Optional.of("connection refused"), connection -> false,
				environment::get);

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> guard.run("mongodb://oc:s3cret@localhost:1/opencelium", dataDir)).actual();

		assertThat(ex.getMessage()).contains("mongodb://oc:****@localhost:1/opencelium", "connection refused")
				.doesNotContain("s3cret");
		assertThat(ex.exitCode()).isEqualTo(1);
	}

	private MasterKeyGuard guard() {
		return new MasterKeyGuard(new MongoStartupPing()::check, WrappedDekProbe::existsAny, environment::get);
	}

	/** A document in the place of a wrapped data key: the guard asks only whether one exists. */
	private static void storeWrappedDek() {
		try (MongoClient client = client()) {
			keys(client).insertOne(new Document("tenantId", "default").append("rootKeyId", "k-01"));
		}
	}

	/** Gives up after 5 s when the server is gone, as the setup ping does. */
	private static MongoClient client() {
		return MongoClients.create(MongoClientSettings.builder().applyConnectionString(new ConnectionString(URI))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build());
	}

	private static MongoCollection<Document> keys(MongoClient client) {
		return client.getDatabase(LocalMongo.databaseFor(MasterKeyGuardTest.class)).getCollection(WrappedDek.COLLECTION);
	}

	private static String randomKey() {
		byte[] key = new byte[32];
		new SecureRandom().nextBytes(key);
		return Base64.getEncoder().encodeToString(key);
	}

}
