package io.opencelium.core.secrets.keys;

import java.nio.file.Path;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

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
import org.springframework.data.mongodb.core.query.Query;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * Starts the real application, as {@code java -jar} would, and reads what the start stored in the database. Each test
 * starts from a new installation: no stored key and a new data directory, so a start generates its own master key.
 */
@ExtendWith({OutputCaptureExtension.class, LocalMongo.Cleanup.class})
class SigningKeyLoaderTest {

	private static final String DATABASE = LocalMongo.databaseFor(SigningKeyLoaderTest.class);

	/** Rounds of the 2 parallel loads: the more rounds, the more often the 2 inserts meet. */
	private static final int ROUNDS = 5;

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
	void startAsANewInstallation() {
		LocalMongo.dropKeyCollections(SigningKeyLoaderTest.class);
	}

	@Test
	void loadGeneratesTheSystemDekAndTheSigningKeyWhenTheDatabaseIsEmpty() {
		try (ConfigurableApplicationContext context = start()) {
			List<WrappedDek> systemDeks = systemDeks();
			List<EncryptedSigningKey> signingKeys = signingKeys();
			assertThat(systemDeks).hasSize(1);
			assertThat(signingKeys).hasSize(1);

			byte[] systemDek = new DekWrapper().unwrap(context.getBean(RootKey.class), systemDeks.getFirst());
			byte[] stored = new SigningKeyCipher().decrypt(systemDek, signingKeys.getFirst());

			assertThat(stored).hasSize(32).isEqualTo(keyInMemory(context));
		}
	}

	@Test
	void loadWrapsTheSystemDekWithTheTenantSystemWhenItGeneratesIt() {
		try (ConfigurableApplicationContext context = start()) {
			RootKey rootKey = context.getBean(RootKey.class);
			assertThat(systemDeks()).hasSize(1);
			WrappedDek stored = systemDeks().getFirst();
			var moved = new WrappedDek(stored.id(), TenantId.SELF_HOST.value(), stored.rootKeyId(), stored.dekVersion(),
					stored.iv(), stored.ciphertext(), stored.createdAt());

			assertThat(stored.dekVersion()).isEqualTo(1);
			assertThat(stored.rootKeyId()).isEqualTo(RootKey.INITIAL_ID);
			assertThat(new DekWrapper().unwrap(rootKey, stored)).hasSize(32);
			assertThatExceptionOfType(WrongKeyException.class).isThrownBy(() -> new DekWrapper().unwrap(rootKey, moved));
		}
	}

	@Test
	void loadReadsTheStoredSigningKeyWhenCoreStartsAgain() {
		String firstId;
		byte[] firstKey;
		try (ConfigurableApplicationContext context = start()) {
			assertThat(signingKeys()).hasSize(1);
			firstId = signingKeys().getFirst().id();
			firstKey = keyInMemory(context);
		}

		try (ConfigurableApplicationContext context = start()) {
			assertThat(signingKeys()).singleElement().extracting(EncryptedSigningKey::id).isEqualTo(firstId);
			assertThat(systemDeks()).hasSize(1);
			assertThat(keyInMemory(context)).isEqualTo(firstKey);
		}
	}

	@Test
	void loadGivesOneSigningKeyWhenTwoThreadsStartOnAnEmptyDatabase() throws Exception {
		try (ConfigurableApplicationContext context = start();
				ExecutorService executor = Executors.newFixedThreadPool(2)) {
			SigningKeyLoader loader = context.getBean(SigningKeyLoader.class);
			for (int round = 1; round <= ROUNDS; round++) {
				removeStoredKeys();
				var barrier = new CyclicBarrier(2);
				Callable<byte[]> load = () -> {
					barrier.await(10, TimeUnit.SECONDS);
					try (SigningKey key = loader.load()) {
						return key.secretKey().getEncoded();
					}
				};

				Future<byte[]> first = executor.submit(load);
				Future<byte[]> second = executor.submit(load);

				assertThat(first.get(10, TimeUnit.SECONDS)).as("round %d", round)
						.isEqualTo(second.get(10, TimeUnit.SECONDS));
				assertThat(systemDeks()).as("round %d", round).hasSize(1);
				assertThat(signingKeys()).as("round %d", round).hasSize(1);
			}
		}
	}

	@Test
	void loadGeneratesNoSystemDekWhenTheKeyCanaryStopsTheStart(CapturedOutput output) throws Exception {
		storeTenantDekWrappedWith(new RootKeyGenerator().generate(keys.resolve("a.key")));
		Path otherKeyFile = keys.resolve("b.key");
		new RootKeyGenerator().generate(otherKeyFile).close();

		assertThatThrownBy(() -> start(CoreStartup.arg(OpenCeliumProperties.MASTER_KEY_FILE, otherKeyFile.toString())));

		assertThat(output).contains("APPLICATION FAILED TO START").contains(KeyStartupException.RESTORE_OR_RESET);
		assertThat(systemDeks()).isEmpty();
		assertThat(signingKeys()).isEmpty();
	}

	@Test
	void startStopsWithAMessageWhenTheStoredSigningKeyDoesNotDecrypt(CapturedOutput output) {
		start().close();
		assertThat(signingKeys()).hasSize(1);
		String storedId = signingKeys().getFirst().id();
		mongo.getCollection(EncryptedSigningKey.COLLECTION)
				.updateOne(new Document(), new Document("$set", new Document("iv", new byte[12])));
		int firstStartEnd = output.toString().length();

		assertThatThrownBy(this::start);

		assertThat(output.toString().substring(firstStartEnd)).contains("APPLICATION FAILED TO START")
				.contains("signing key").contains("'" + EncryptedSigningKey.COLLECTION + "'");
		assertThat(signingKeys()).singleElement().extracting(EncryptedSigningKey::id).isEqualTo(storedId);
	}

	@Test
	void startStopsWithAMessageWhenTheStoredSigningKeyIsDamaged(CapturedOutput output) {
		start().close();
		assertThat(signingKeys()).hasSize(1);
		mongo.getCollection(EncryptedSigningKey.COLLECTION)
				.updateOne(new Document(), new Document("$set", new Document("iv", new byte[3])));
		int firstStartEnd = output.toString().length();

		assertThatThrownBy(this::start);

		assertThat(output.toString().substring(firstStartEnd)).contains("APPLICATION FAILED TO START")
				.contains("is damaged: its iv is not 12 bytes").contains("'" + EncryptedSigningKey.COLLECTION + "'");
		assertThat(signingKeys()).hasSize(1);
	}

	@Test
	void stopZeroesTheSigningKeyWhenCoreStops() {
		SigningKey key;
		try (ConfigurableApplicationContext context = start()) {
			key = context.getBean(SigningKeyLoader.class).signingKey();
		}

		assertThatIllegalStateException().isThrownBy(key::secretKey).withMessageContaining("closed");
	}

	private ConfigurableApplicationContext start(String... args) {
		String[] all = new String[args.length + 1];
		all[0] = CoreStartup.mongoUri(LocalMongo.uri(DATABASE));
		System.arraycopy(args, 0, all, 1, args.length);
		return CoreStartup.run(Map.of(), dataDir, all);
	}

	/** A copy of the key that the start put into memory. */
	private static byte[] keyInMemory(ConfigurableApplicationContext context) {
		return context.getBean(SigningKeyLoader.class).signingKey().secretKey().getEncoded();
	}

	private static List<WrappedDek> systemDeks() {
		return mongo.find(Query.query(where("tenantId").is(TenantId.SYSTEM.value())), WrappedDek.class);
	}

	private static List<EncryptedSigningKey> signingKeys() {
		return mongo.findAll(EncryptedSigningKey.class);
	}

	/** Removes the stored keys and keeps the 2 collections with their indexes. */
	private static void removeStoredKeys() {
		mongo.remove(new Query(), WrappedDek.class);
		mongo.remove(new Query(), EncryptedSigningKey.class);
	}

	private static void storeTenantDekWrappedWith(RootKey rootKey) {
		byte[] dek = new byte[32];
		new SecureRandom().nextBytes(dek);
		mongo.insert(new DekWrapper().wrap(rootKey, TenantId.SELF_HOST, 1, dek, Instant.now()));
	}

}
