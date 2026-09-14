package io.opencelium.common.tenant;

import java.util.Objects;

/**
 * Identifies one tenant.
 *
 * <p>Every stored document, job message and event carries this id: in cloud mode each tenant has
 * its own database, and in self-hosted mode a single tenant shares one. Persistence and API layers
 * enforce isolation with it.
 */
public record TenantId(String value) {

    public TenantId {
        Objects.requireNonNull(value, "tenant id must not be null");
        if (value.isBlank()) {
            throw new IllegalArgumentException("tenant id must not be blank");
        }
    }

    public static TenantId of(String value) {
        return new TenantId(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
