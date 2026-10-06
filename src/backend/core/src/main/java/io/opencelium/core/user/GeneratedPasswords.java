package io.opencelium.core.user;

import java.security.SecureRandom;

/**
 * Passwords for accounts created without a typed one: 20 characters from {@code [A-Za-z0-9-]} with at least one
 * upper-case letter, one lower-case letter and one digit (about 119 bits). Returned as {@code char[]} so the caller
 * can zero it after use.
 */
public final class GeneratedPasswords {

	static final int LENGTH = 20;

	static final String ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-";

	private final SecureRandom random;

	public GeneratedPasswords() {
		this(new SecureRandom());
	}

	GeneratedPasswords(SecureRandom random) {
		this.random = random;
	}

	public char[] next() {
		char[] password = new char[LENGTH];
		// Drawing again until every class is present keeps each accepted password uniformly distributed.
		do {
			for (int i = 0; i < LENGTH; i++) {
				password[i] = ALPHABET.charAt(random.nextInt(ALPHABET.length()));
			}
		}
		while (!hasUpperLowerAndDigit(password));
		return password;
	}

	private static boolean hasUpperLowerAndDigit(char[] password) {
		boolean upper = false;
		boolean lower = false;
		boolean digit = false;
		for (char c : password) {
			upper |= c >= 'A' && c <= 'Z';
			lower |= c >= 'a' && c <= 'z';
			digit |= c >= '0' && c <= '9';
		}
		return upper && lower && digit;
	}

}
