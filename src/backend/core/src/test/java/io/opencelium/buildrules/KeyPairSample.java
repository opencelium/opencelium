package io.opencelium.buildrules;

import java.security.KeyPair;

/** Breaks the rule "cryptography only in core.secrets": a key pair, which holds a private key, outside that package. */
class KeyPairSample {

	KeyPair keyPair;

}
