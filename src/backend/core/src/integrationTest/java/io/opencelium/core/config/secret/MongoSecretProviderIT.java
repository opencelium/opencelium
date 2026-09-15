package io.opencelium.core.config.secret;

import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import io.opencelium.common.secret.SecretIntegrityException;
import io.opencelium.common.secret.SecretNotFoundException;
import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretRef;
import io.opencelium.common.secret.SecretValue;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testutil.TestKeys;
import org.bson.Document;
import org.bson.types.Binary;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mongodb.MongoDBContainer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The secret store against a real MongoDB: only ciphertext reaches the database, an edit made
 * straight in the collection is detected, one client cannot resolve another's reference, and the
 * value never appears in the log.
 */
@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@ExtendWith(OutputCaptureExtension.class)
class MongoSecretProviderIT {

    private static final String CANARY = "canary-8f31c2a7";
    private static final TenantId TENANT = TenantId.of("t-123");
    private static final TenantId OTHER_TENANT = TenantId.of("t-999");

    private static final Logger log = LoggerFactory.getLogger(MongoSecretProviderIT.class);

    @Container
    static MongoDBContainer mongodb = new MongoDBContainer("mongo:8.0");

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.mongodb.uri", mongodb::getReplicaSetUrl);
        registry.add("opencelium.security.master-key", TestKeys::base64Aes256);
        registry.add("opencelium.auth.jwt.signing-key", TestKeys::base64Aes256);
        // A real database is running here, so the startup check may do its job.
        registry.add("opencelium.tenancy.self-hosted.verify-connection-on-startup", () -> "true");
    }

    @Autowired
    private SecretProvider secretProvider;

    @Autowired
    private MongoClient mongoClient;

    @Test
    void retrieveReturnsTheStoredValue() {
        SecretRef ref = secretProvider.store(TENANT, SecretValue.of(CANARY));

        assertThat(secretProvider.retrieve(TENANT, ref).asString()).isEqualTo(CANARY);
    }

    @Test
    void storedDocumentContainsCiphertextOnly() {
        SecretRef ref = secretProvider.store(TENANT, SecretValue.of(CANARY));

        Document raw = rawSecret(ref);

        assertThat(raw).isNotNull();
        assertThat(raw.toJson()).doesNotContain("canary");
        assertThat(raw.getString("alg")).isEqualTo(AesGcmCipher.ALGORITHM);
        assertThat(raw.get("iv", Binary.class).getData()).hasSize(12);
        assertThat(raw.getString("tenantId")).isEqualTo(TENANT.value());
    }

    @Test
    void retrieveFailsAfterTheStoredDataIsEditedInTheDatabase() {
        SecretRef ref = secretProvider.store(TENANT, SecretValue.of(CANARY));
        byte[] tampered = rawSecret(ref).get("ciphertext", Binary.class).getData().clone();
        tampered[0] ^= 0x01;
        secrets().updateOne(Filters.eq("_id", ref.id()), Updates.set("ciphertext", new Binary(tampered)));

        assertThatExceptionOfType(SecretIntegrityException.class)
                .isThrownBy(() -> secretProvider.retrieve(TENANT, ref));
    }

    @Test
    void retrieveFailsForAnotherClientHoldingTheSameReference() {
        SecretRef ref = secretProvider.store(TENANT, SecretValue.of(CANARY));

        assertThatExceptionOfType(SecretNotFoundException.class)
                .isThrownBy(() -> secretProvider.retrieve(OTHER_TENANT, ref));
    }

    @Test
    void deleteRemovesTheSecret() {
        SecretRef ref = secretProvider.store(TENANT, SecretValue.of(CANARY));

        secretProvider.delete(TENANT, ref);

        assertThatExceptionOfType(SecretNotFoundException.class)
                .isThrownBy(() -> secretProvider.retrieve(TENANT, ref));
        assertThat(rawSecret(ref)).isNull();
    }

    @Test
    void theValueNeverReachesTheLog(CapturedOutput output) {
        SecretRef ref = secretProvider.store(TENANT, SecretValue.of(CANARY));
        SecretValue retrieved = secretProvider.retrieve(TENANT, ref);

        // Everything an unwary caller might log:
        log.info("stored secret {} for tenant {} with value {}", ref, TENANT, retrieved);
        log.info("stored document: {}", rawSecret(ref).toJson());

        assertThat(output).doesNotContain(CANARY);
        assertThat(output).contains(ref.id());
    }

    private Document rawSecret(SecretRef ref) {
        return secrets().find(Filters.eq("_id", ref.id())).first();
    }

    private MongoCollection<Document> secrets() {
        String database = new ConnectionString(mongodb.getReplicaSetUrl()).getDatabase();
        return mongoClient.getDatabase(database).getCollection(SecretDocument.COLLECTION);
    }
}
