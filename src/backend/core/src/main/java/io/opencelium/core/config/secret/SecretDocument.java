package io.opencelium.core.config.secret;

import java.time.Instant;

public record SecretDocument(

        String id,

        String tenantId,

        String alg,

        String keyId,

        byte[] iv,

        byte[] ciphertext,

        Instant createdAt) {

    public static final String COLLECTION = "secrets";

    @Override
    public String toString() {
        return "SecretDocument[id=" + id + ", tenantId=" + tenantId + ", alg=" + alg
                + ", keyId=" + keyId + ", createdAt=" + createdAt + "]";
    }
}
