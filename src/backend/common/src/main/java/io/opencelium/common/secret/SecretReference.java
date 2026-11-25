package io.opencelium.common.secret;

import io.opencelium.common.tenant.TenantId;

/**
 * A reference to 1 secret in the secret storage: its owner and its ID. A document that needs a secret, for example a
 * setting of the broker password, keeps this reference and never the value. The reference shows no value, because it
 * holds none; only the secret provider gives the value, at the moment of use.
 *
 * @param owner the owner of the secret: a tenant, or the reserved tenant {@code system} for a secret of the
 *              installation
 * @param id    the ID of the secret in the secret storage
 */
public record SecretReference(TenantId owner, String id) {

}
