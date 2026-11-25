package io.opencelium.buildrules;

import io.opencelium.core.secrets.keys.RootKey;

/** Breaks the rule "cryptography only in core.secrets": a class outside that package holds the root key. */
class RootKeySample {

	void zero(RootKey key) {
		key.close();
	}

}
