package io.opencelium.core.secrets.keys;

/**
 * Puts the signing key of the installation into memory at the start, after the key canary. On a new installation it
 * generates the system data key and the signing key and stores them in the database that the yml file names; at each
 * later start, and in each other core instance, it reads the same keys. Unique indexes accept 1 document for each
 * version, so when 2 core instances start on an empty database at the same time, the one whose insert fails reads the
 * stored document.
 */
final class SigningKeyLoader {

	/** The signing key that the start loaded. */
	SigningKey signingKey() {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	/**
	 * Reads the system data key and the newest signing key, and generates and stores each one that does not exist.
	 *
	 * @return a new in-memory copy of the stored signing key; the caller closes it
	 * @throws KeyStartupException when a stored key does not decrypt or is damaged
	 */
	SigningKey load() {
		throw new UnsupportedOperationException("Not implemented yet");
	}

}
