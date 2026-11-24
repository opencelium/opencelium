package io.opencelium.buildrules;

import java.security.GeneralSecurityException;

import javax.crypto.Cipher;

/** Breaks the rule "cryptography only in core.secrets": a cipher outside that package. */
class CipherSample {

	Cipher cipher() throws GeneralSecurityException {
		return Cipher.getInstance("AES/GCM/NoPadding");
	}

}
