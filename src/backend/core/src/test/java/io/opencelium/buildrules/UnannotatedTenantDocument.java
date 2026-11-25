package io.opencelium.buildrules;

import io.opencelium.core.tenant.TenantDocument;

/**
 * Breaks the rule for the secret fields: a tenant document without the annotation keeps a password as text; MongoDB
 * stores it all the same.
 */
record UnannotatedTenantDocument(String id, String tenantId, String password) implements TenantDocument {

}
