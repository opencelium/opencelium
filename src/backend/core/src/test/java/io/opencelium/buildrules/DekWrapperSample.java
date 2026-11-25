package io.opencelium.buildrules;

import io.opencelium.core.secrets.keys.DekWrapper;

/** Breaks the rule "cryptography only in core.secrets": a class outside that package makes a DEK wrapper. */
class DekWrapperSample {

	DekWrapper wrapper() {
		return new DekWrapper();
	}

}
