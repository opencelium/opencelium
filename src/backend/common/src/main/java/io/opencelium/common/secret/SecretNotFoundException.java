package io.opencelium.common.secret;

import io.opencelium.common.tenant.TenantId;

/** No secret with the given reference exists for the given tenant. */
public class SecretNotFoundException extends SecretException {

    public SecretNotFoundException(TenantId tenant, SecretRef ref) {
        super("No secret " + ref + " for tenant " + tenant);
    }
}
