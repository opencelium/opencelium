package io.opencelium.buildrules;

import org.springframework.security.crypto.encrypt.Encryptors;

/**
 * Breaks the rule "cryptography only in core.secrets": an encryptor of Spring Security derives a key from a password
 * and encrypts outside that package.
 */
class EncryptorSample {

	byte[] encrypt(String password, String salt, byte[] value) {
		return Encryptors.stronger(password, salt).encrypt(value);
	}

}
