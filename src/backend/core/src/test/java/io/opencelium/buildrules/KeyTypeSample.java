package io.opencelium.buildrules;

import java.security.GeneralSecurityException;
import java.security.PrivateKey;
import java.security.Signature;

/** Breaks the rule "cryptography only in core.secrets": a signature with a private key outside that package. */
class KeyTypeSample {

	byte[] sign(PrivateKey key, byte[] data) throws GeneralSecurityException {
		Signature signature = Signature.getInstance("SHA256withRSA");
		signature.initSign(key);
		signature.update(data);
		return signature.sign();
	}

}
