package io.opencelium.core.secrets.keys;

import java.time.Instant;

/**
 * Encrypts and decrypts the signing key with the system data key, with AES-256-GCM and a new random 12-byte IV for
 * each encryption. The purpose and the version of the signing key are authenticated as associated data, so the
 * ciphertext of a signing key does not decrypt as another value or as another version.
 */
final class SigningKeyCipher {

	/**
	 * @param systemDek  the 32-byte system data key; the caller zeroes it after use
	 * @param signingKey the 32-byte signing key; the caller zeroes it after use
	 */
	EncryptedSigningKey encrypt(byte[] systemDek, int version, byte[] signingKey, Instant createdAt) {
		throw new UnsupportedOperationException("Not implemented yet");
	}

	/**
	 * @return the 32-byte signing key; the caller zeroes it or hands it to a {@link SigningKey}
	 * @throws WrongKeyException        when {@code systemDek} did not encrypt this key, or the document was changed
	 * @throws IllegalArgumentException when the document lacks fields or has fields of the wrong length
	 */
	byte[] decrypt(byte[] systemDek, EncryptedSigningKey stored) {
		throw new UnsupportedOperationException("Not implemented yet");
	}

}
