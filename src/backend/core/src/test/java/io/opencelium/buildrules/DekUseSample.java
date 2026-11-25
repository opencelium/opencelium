package io.opencelium.buildrules;

import io.opencelium.core.secrets.keys.DekAccess.DekUse;

/** Breaks the rule "cryptography only in core.secrets": an operation outside that package gets the bytes of a DEK. */
class DekUseSample implements DekUse<byte[]> {

	@Override
	public byte[] apply(int version, byte[] dek) {
		return dek.clone();
	}

}
