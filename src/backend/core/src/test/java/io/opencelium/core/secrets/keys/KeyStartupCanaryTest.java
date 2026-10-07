package io.opencelium.core.secrets.keys;

import java.nio.file.Path;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.mongodb.core.MongoTemplate;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Starts the real application against a database seeded with a wrapped data key, as {@code java -jar} would. */
@ExtendWith({OutputCaptureExtension.class, LocalMongo.Cleanup.class})
class KeyStartupCanaryTest {

	private static final String DATABASE = LocalMongo.databaseFor(KeyStartupCanaryTest.class);

	private static MongoClient client;

	private static MongoTemplate mongo;

	@TempDir
	Path dataDir;

	@TempDir
	Path keys;

	@BeforeAll
	static void connect() {
		client = MongoClients.create(LocalMongo.uri(DATABASE));
		mongo = new MongoTemplate(client, DATABASE);
	}

	@AfterAll
	static void closeClient() {
		client.close();
	}

	@BeforeEach
	void removeDataKeys() {
		mongo.dropCollection(WrappedDek.class);
	}

	@Test
	void startSkipsTheCanaryWhenNoDataKeyIsStored(CapturedOutput output) {
		start(Map.of()).close();

		assertThat(output).contains("No stored data keys yet; canary unwrap skipped (key id k-01)");
	}

	@Test
	void startPassesTheCanaryWhenTheDataKeyWasWrappedWithTheConfiguredKey(CapturedOutput output) throws Exception {
		Path keyFile = keys.resolve("a.key");
		storeDataKeyWrappedWith(new RootKeyGenerator().generate(keyFile));

		start(Map.of(), "--opencelium.master-key-file=" + keyFile).close();

		assertThat(output).contains("Master key canary unwrap ok (key id k-01)");
	}

	@Test
	void startStopsWithRestoreOrResetWhenTheDataKeyWasWrappedWithAnotherKey(CapturedOutput output) throws Exception {
		storeDataKeyWrappedWith(new RootKeyGenerator().generate(keys.resolve("a.key")));
		Path otherKeyFile = keys.resolve("b.key");
		new RootKeyGenerator().generate(otherKeyFile);

		assertThatThrownBy(() -> start(Map.of(), "--opencelium.master-key-file=" + otherKeyFile));

		assertThat(output).contains("APPLICATION FAILED TO START").contains(KeyStartupException.RESTORE_OR_RESET)
				.contains("cannot decrypt the stored data key of tenant 'self'")
				.contains("Do not replace it with a new key");
	}

	@Test
	void startStopsWithRestoreOrResetAndGeneratesNoKeyWhenADataKeyIsStoredButNoKeyIsFound(CapturedOutput output)
			throws Exception {
		storeDataKeyWrappedWith(new RootKeyGenerator().generate(keys.resolve("a.key")));

		assertThatThrownBy(() -> start(Map.of()));

		assertThat(output).contains("APPLICATION FAILED TO START").contains(KeyStartupException.RESTORE_OR_RESET)
				.contains("No master key was found");
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	@Test
	void startStopsWhenTheStoredDataKeyLacksFields(CapturedOutput output) {
		mongo.getCollection("keys").insertOne(new Document("tenantId", "self"));

		assertThatThrownBy(() -> start(Map.of("OC_MASTER_KEY", randomKey())));

		assertThat(output).contains("APPLICATION FAILED TO START")
				.contains("The oldest stored data key in collection 'keys' is damaged")
				.contains("Restore the 'keys' collection from a database backup");
	}

	@Test
	void startStopsWhenTheStoredDataKeyHasAnIvOfTheWrongLength(CapturedOutput output) {
		mongo.getCollection("keys").insertOne(new Document("tenantId", "self").append("rootKeyId", "k-01")
				.append("dekVersion", 1).append("iv", new byte[3]).append("ciphertext", new byte[48]));

		assertThatThrownBy(() -> start(Map.of("OC_MASTER_KEY", randomKey())));

		assertThat(output).contains("APPLICATION FAILED TO START").contains("is damaged: its iv is not 12 bytes");
	}

	private void storeDataKeyWrappedWith(RootKey rootKey) {
		byte[] dek = new byte[32];
		new SecureRandom().nextBytes(dek);
		mongo.insert(new DekWrapper().wrap(rootKey, TenantId.SELF, 1, dek, Instant.now()));
	}

	private ConfigurableApplicationContext start(Map<String, String> environmentVariables, String... args) {
		String[] all = new String[args.length + 1];
		all[0] = CoreStartup.mongoUri(LocalMongo.uri(DATABASE));
		System.arraycopy(args, 0, all, 1, args.length);
		return CoreStartup.run(environmentVariables, dataDir, all);
	}

	private static String randomKey() {
		byte[] key = new byte[32];
		new SecureRandom().nextBytes(key);
		return Base64.getEncoder().encodeToString(key);
	}

}
