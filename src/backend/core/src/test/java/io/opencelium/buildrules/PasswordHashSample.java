package io.opencelium.buildrules;

import java.security.SecureRandom;

import org.springframework.security.crypto.factory.PasswordEncoderFactories;

/**
 * Keeps the rule "cryptography only in core.secrets": a password hash and a random value use no key material.
 */
class PasswordHashSample {

	String hash(String password) {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder().encode(password);
	}

	int randomValue() {
		return new SecureRandom().nextInt();
	}

}
