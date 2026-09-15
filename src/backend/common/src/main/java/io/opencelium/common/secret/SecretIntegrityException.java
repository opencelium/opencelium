package io.opencelium.common.secret;

import io.opencelium.common.tenant.TenantId;

public class SecretIntegrityException extends SecretException {

    public SecretIntegrityException(TenantId tenant, SecretRef ref, Throwable cause) {
        super("Secret " + ref + " of tenant " + tenant
                + " failed its integrity check: the stored data was modified, belongs elsewhere, "
                + "or was written with a different master key", cause);
    }
}
