package io.opencelium.core.secrets;

import java.time.Instant;

import io.opencelium.common.tenant.TenantId;

/**
 * Encrypts and decrypts a secret with the DEK of its owner, with AES-256-GCM and a new random IV for each encryption.
 * The owner, the secret ID and the DEK version are authenticated as associated data, so a ciphertext that a person
 * copies to another secret or to another owner does not decrypt.
 */
final class SecretCipher {

	/**
	 * @param dek       the 32-byte DEK of the owner; the caller zeroes it
	 * @param plaintext the value; the caller zeroes it
	 */
	SecretDocument encrypt(byte[] dek, TenantId owner, String id, int dekVersion, byte[] plaintext,
			Instant createdAt) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/**
	 * @return the value; the caller zeroes it
	 * @throws SecretDecryptionException when the DEK or the associated data does not fit the ciphertext
	 */
	byte[] decrypt(byte[] dek, SecretDocument stored) {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
