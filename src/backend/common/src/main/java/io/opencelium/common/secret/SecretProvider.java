package io.opencelium.common.secret;

import io.opencelium.common.tenant.TenantId;

public interface SecretProvider {

    /**
     * Encrypts and stores a value.
     *
     * @return the reference to keep in the owning document; it carries no secret material
     */
    SecretRef store(TenantId tenant, SecretValue value);

    /**
     * Resolves a previously stored value.
     *
     * @throws SecretNotFoundException  no secret with this reference exists for this tenant
     * @throws SecretIntegrityException the stored data was altered, or belongs to another tenant or
     *                                  reference
     */
    SecretValue retrieve(TenantId tenant, SecretRef ref);

    /**
     * Removes a secret. Deleting an unknown reference is a no-op, so callers can clean up safely
     * without checking first.
     */
    void delete(TenantId tenant, SecretRef ref);
}
