package io.opencelium.common.secret;

import java.util.Objects;

/**
 * An opaque handle to a stored secret.
 *
 * <p>It contains no secret material, so it is safe to store in a document, log, and return from an
 * API. Only {@link SecretProvider#retrieve} turns it back into a value.
 */
public record SecretRef(String id) {

    public SecretRef {
        Objects.requireNonNull(id, "secret ref id must not be null");
        if (id.isBlank()) {
            throw new IllegalArgumentException("secret ref id must not be blank");
        }
    }

    public static SecretRef of(String id) {
        return new SecretRef(id);
    }

    @Override
    public String toString() {
        return id;
    }
}
