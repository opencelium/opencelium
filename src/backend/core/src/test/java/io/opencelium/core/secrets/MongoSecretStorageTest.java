package io.opencelium.core.secrets;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

import org.bson.Document;
import org.bson.types.Binary;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretReference;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.secrets.keys.DekAccess;
import io.opencelium.core.testsupport.Bytes;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The secret storage keeps a secret of the installation as 1 ciphertext in the {@code secrets} collection, gives the
 * value back only through the provider, and deletes it.
 */
@MongoIntegrationTest
class MongoSecretStorageTest {

	private static final String VALUE = "s3cret-value";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, MongoSecretStorageTest.class, () -> dataDir);
	}

	@Autowired
	SecretProvider secrets;

	@Autowired
	MongoTemplate mongo;

	@Autowired
	DekAccess dekAccess;

	@Test
	void storeKeepsOnlyTheCiphertextWhenItStoresASecret() {
		byte[] plaintext = VALUE.getBytes(StandardCharsets.UTF_8);

		SecretReference reference = secrets.store(TenantId.SYSTEM, plaintext.clone());

		assertThat(reference.owner()).isEqualTo(TenantId.SYSTEM);
		Document stored = mongo.getCollection("secrets").find(new Document("_id", reference.id())).first();
		assertThat(stored).isNotNull();
		assertThat(stored.getString("tenantId")).isEqualTo("system");
		assertThat(stored.getInteger("dekVersion")).isEqualTo(1);
		assertThat(stored.get("iv", Binary.class).getData()).hasSize(12);
		byte[] ciphertext = stored.get("ciphertext", Binary.class).getData();
		assertThat(ciphertext).as("the encrypted value and the 16-byte GCM tag").hasSize(plaintext.length + 16);
		assertThat(Bytes.contains(ciphertext, plaintext)).as("the ciphertext holds the plaintext").isFalse();
		SecretDocument document = mongo.findById(reference.id(), SecretDocument.class);
		byte[] decrypted = dekAccess.use(TenantId.SYSTEM, document.dekVersion(),
				(version, dek) -> new SecretCipher().decrypt(dek, document));
		assertThat(decrypted).as("the ciphertext decrypted with the system DEK").isEqualTo(plaintext);
	}

	@Test
	void readGivesThePlaintextWhenTheSecretIsStored() {
		SecretReference reference = secrets.store(TenantId.SYSTEM, VALUE.getBytes(StandardCharsets.UTF_8));

		assertThat(new String(secrets.read(reference), StandardCharsets.UTF_8)).isEqualTo(VALUE);
	}

	@Test
	void deleteRemovesTheDocumentWhenTheSecretIsStored() {
		SecretReference reference = secrets.store(TenantId.SYSTEM, VALUE.getBytes(StandardCharsets.UTF_8));

		secrets.delete(reference);

		assertThat(mongo.getCollection("secrets").countDocuments(new Document("_id", reference.id()))).isZero();
	}

	@Test
	void deleteChangesNothingWhenTheSecretDoesNotExist() {
		SecretReference kept = secrets.store(TenantId.SYSTEM, VALUE.getBytes(StandardCharsets.UTF_8));

		secrets.delete(new SecretReference(TenantId.SYSTEM, "no-such-secret"));

		assertThat(mongo.getCollection("secrets").countDocuments(new Document("_id", kept.id()))).isOne();
	}

}
