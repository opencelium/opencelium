package io.opencelium.core.config.secret;

import io.opencelium.common.secret.SecretIntegrityException;
import io.opencelium.common.secret.SecretNotFoundException;
import io.opencelium.common.secret.SecretRef;
import io.opencelium.common.secret.SecretValue;
import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.SecurityProperties;
import io.opencelium.core.testutil.TestKeys;
import io.opencelium.core.testutil.fake.InMemorySecretRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatNoException;

class MongoSecretProviderTest {

    private static final TenantId TENANT = TenantId.of("t-123");
    private static final TenantId OTHER_TENANT = TenantId.of("t-999");
    private static final String CANARY = "canary-8f31c2a7";

    private final InMemorySecretRepository repository = new InMemorySecretRepository();

    private MongoSecretProvider provider;

    @BeforeEach
    void setUp() {
        provider = newProvider(TestKeys.base64Aes256());
    }

    @Test
    void storeWritesCiphertextOnlyAndReturnsAReferenceToIt() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));

        SecretDocument stored = repository.get(TENANT, ref.id());
        assertThat(stored.tenantId()).isEqualTo(TENANT.value());
        assertThat(stored.alg()).isEqualTo(AesGcmCipher.ALGORITHM);
        assertThat(stored.keyId()).isEqualTo(MasterKey.CURRENT_KEY_ID);
        assertThat(new String(stored.ciphertext(), StandardCharsets.UTF_8)).doesNotContain("canary");
        assertThat(stored.toString()).doesNotContain("canary");
    }

    @Test
    void retrieveReturnsTheOriginalValue() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));

        assertThat(provider.retrieve(TENANT, ref).asString()).isEqualTo(CANARY);
    }

    @Test
    void storeUsesAFreshIvSoTheSameValueIsNeverStoredTwiceTheSameWay() {
        SecretRef first = provider.store(TENANT, SecretValue.of(CANARY));
        SecretRef second = provider.store(TENANT, SecretValue.of(CANARY));

        assertThat(first.id()).isNotEqualTo(second.id());
        assertThat(repository.get(TENANT, first.id()).ciphertext())
                .isNotEqualTo(repository.get(TENANT, second.id()).ciphertext());
    }

    @Test
    void retrieveThrowsSecretIntegrityExceptionWhenTheStoredDataWasEdited() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));
        SecretDocument stored = repository.get(TENANT, ref.id());
        byte[] tampered = stored.ciphertext().clone();
        tampered[0] ^= 0x01;
        repository.replace(TENANT, new SecretDocument(stored.id(), stored.tenantId(), stored.alg(),
                stored.keyId(), stored.iv(), tampered, stored.createdAt()));

        assertThatExceptionOfType(SecretIntegrityException.class)
                .isThrownBy(() -> provider.retrieve(TENANT, ref))
                .withMessageContaining(ref.id())
                .satisfies(failure -> assertThat(failure.getMessage()).doesNotContain("canary"));
    }

    @Test
    void retrieveThrowsSecretIntegrityExceptionWhenCiphertextIsCopiedFromAnotherTenant() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));
        SecretDocument stolen = repository.get(TENANT, ref.id());
        repository.insert(OTHER_TENANT, new SecretDocument(stolen.id(), OTHER_TENANT.value(), stolen.alg(),
                stolen.keyId(), stolen.iv(), stolen.ciphertext(), stolen.createdAt()));

        assertThatExceptionOfType(SecretIntegrityException.class)
                .isThrownBy(() -> provider.retrieve(OTHER_TENANT, ref));
    }

    @Test
    void retrieveThrowsSecretIntegrityExceptionWhenTheMasterKeyChanged() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));

        MongoSecretProvider withOtherKey = newProvider(TestKeys.base64Aes256());

        assertThatExceptionOfType(SecretIntegrityException.class)
                .isThrownBy(() -> withOtherKey.retrieve(TENANT, ref));
    }

    @Test
    void retrieveThrowsSecretNotFoundExceptionWhenTheTenantDoesNotOwnTheReference() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));

        assertThatExceptionOfType(SecretNotFoundException.class)
                .isThrownBy(() -> provider.retrieve(OTHER_TENANT, ref));
    }

    @Test
    void retrieveThrowsSecretNotFoundExceptionWhenNothingMatches() {
        assertThatExceptionOfType(SecretNotFoundException.class)
                .isThrownBy(() -> provider.retrieve(TENANT, SecretRef.of("sec_missing")));
    }

    @Test
    void deleteRemovesTheSecretAndIsSafeToRepeat() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));

        provider.delete(TENANT, ref);

        assertThat(repository.size()).isZero();
        assertThatNoException().isThrownBy(() -> provider.delete(TENANT, ref));
    }

    @Test
    void deleteLeavesAnotherTenantsSecretUntouched() {
        SecretRef ref = provider.store(TENANT, SecretValue.of(CANARY));

        provider.delete(OTHER_TENANT, ref);

        assertThat(provider.retrieve(TENANT, ref).asString()).isEqualTo(CANARY);
    }

    private MongoSecretProvider newProvider(String base64Key) {
        MasterKey masterKey = new MasterKey(new SecurityProperties(base64Key, SecurityProperties.Provider.MONGO));
        return new MongoSecretProvider(repository, new AesGcmCipher(), masterKey,
                Clock.fixed(Instant.parse("2026-09-14T10:15:00Z"), ZoneOffset.UTC));
    }
}
