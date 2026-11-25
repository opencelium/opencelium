package io.opencelium.buildrules;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.secrets.keys.DekAccess;

/** Breaks the rule "cryptography only in core.secrets": a class outside that package copies the bytes of a DEK. */
class DekAccessSample {

	byte[] copyOfTheDek(DekAccess access, TenantId owner) {
		return access.use(owner, (version, dek) -> dek.clone());
	}

}
