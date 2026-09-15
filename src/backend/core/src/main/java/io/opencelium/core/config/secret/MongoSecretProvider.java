package io.opencelium.core.config.secret;

import io.opencelium.common.secret.SecretIntegrityException;
import io.opencelium.common.secret.SecretNotFoundException;
import io.opencelium.common.secret.SecretProvider;
import io.opencelium.common.secret.SecretRef;
import io.opencelium.common.secret.SecretValue;
import io.opencelium.common.tenant.TenantId;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.time.Clock;
import java.util.Objects;
import java.util.UUID;

public class MongoSecretProvider implements SecretProvider {

    private final SecretRepository repository;
    private final AesGcmCipher cipher;
    private final MasterKey masterKey;
    private final Clock clock;

    public MongoSecretProvider(SecretRepository repository, AesGcmCipher cipher, MasterKey masterKey, Clock clock) {
        this.repository = repository;
        this.cipher = cipher;
        this.masterKey = masterKey;
        this.clock = clock;
    }

    @Override
    public SecretRef store(TenantId tenant, SecretValue value) {
        Objects.requireNonNull(tenant, "tenant must not be null");
        Objects.requireNonNull(value, "value must not be null");

        String id = newId();
        AesGcmCipher.Encrypted encrypted = cipher.encrypt(masterKey.key(), value.bytes(), associatedData(tenant, id));

        repository.insert(tenant, new SecretDocument(id, tenant.value(), AesGcmCipher.ALGORITHM, masterKey.keyId(),
                encrypted.iv(), encrypted.ciphertext(), clock.instant()));

        return new SecretRef(id);
    }

    @Override
    public SecretValue retrieve(TenantId tenant, SecretRef ref) {
        Objects.requireNonNull(tenant, "tenant must not be null");
        Objects.requireNonNull(ref, "ref must not be null");

        SecretDocument document = repository.find(tenant, ref.id())
                .orElseThrow(() -> new SecretNotFoundException(tenant, ref));
        try {
            byte[] plaintext = cipher.decrypt(masterKey.key(), document.iv(), document.ciphertext(),
                    associatedData(tenant, ref.id()));
            return SecretValue.of(plaintext);
        } catch (GeneralSecurityException ex) {
            throw new SecretIntegrityException(tenant, ref, ex);
        }
    }

    @Override
    public void delete(TenantId tenant, SecretRef ref) {
        Objects.requireNonNull(tenant, "tenant must not be null");
        Objects.requireNonNull(ref, "ref must not be null");

        repository.delete(tenant, ref.id());
    }

    /**
     * Ties the ciphertext to this tenant and this document. Authenticated, not encrypted, so it must
     * be reproducible at read time from the lookup itself.
     */
    private static byte[] associatedData(TenantId tenant, String secretId) {
        return (tenant.value() + ':' + secretId).getBytes(StandardCharsets.UTF_8);
    }

    private static String newId() {
        return "sec_" + UUID.randomUUID().toString().replace("-", "");
    }
}
