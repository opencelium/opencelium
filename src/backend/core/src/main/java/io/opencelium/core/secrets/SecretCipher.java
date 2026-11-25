package io.opencelium.core.secrets;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import io.opencelium.common.tenant.TenantId;

/**
 * Encrypts and decrypts a secret with the DEK of its owner, with AES-256-GCM and a new random IV for each encryption.
 * The owner, the secret ID and the DEK version are authenticated as associated data, so a ciphertext that a person
 * copies to another secret or to another owner does not decrypt.
 */
final class SecretCipher {

	private static final int DEK_LENGTH = 32;

	private static final int IV_LENGTH = 12;

	private static final int TAG_BITS = 128;

	private static final String TRANSFORMATION = "AES/GCM/NoPadding";

	private final SecureRandom random = new SecureRandom();

	/**
	 * @param dek       the 32-byte DEK of the owner; the caller zeroes it
	 * @param plaintext the value; the caller zeroes it
	 */
	SecretDocument encrypt(byte[] dek, TenantId owner, String id, int dekVersion, byte[] plaintext,
			Instant createdAt) {
		byte[] iv = new byte[IV_LENGTH];
		random.nextBytes(iv);
		try {
			Cipher cipher = cipher(Cipher.ENCRYPT_MODE, dek, iv, owner.value(), id, dekVersion);
			return new SecretDocument(id, owner.value(), dekVersion, iv, cipher.doFinal(plaintext), createdAt);
		}
		catch (GeneralSecurityException ex) {
			throw new IllegalStateException("AES-GCM is not available in this JVM.", ex);
		}
	}

	/**
	 * @return the value; the caller zeroes it
	 * @throws SecretDecryptionException when the DEK or the associated data does not fit the ciphertext
	 */
	byte[] decrypt(byte[] dek, SecretDocument stored) {
		if (stored.iv() == null || stored.iv().length != IV_LENGTH || stored.ciphertext() == null
				|| stored.ciphertext().length < TAG_BITS / 8) {
			throw new SecretDecryptionException("The stored secret " + stored + " is damaged.", null);
		}
		try {
			Cipher cipher = cipher(Cipher.DECRYPT_MODE, dek, stored.iv(), stored.tenantId(), stored.id(),
					stored.dekVersion());
			return cipher.doFinal(stored.ciphertext());
		}
		catch (AEADBadTagException ex) {
			throw new SecretDecryptionException("The stored secret " + stored
					+ " does not decrypt with the data key of its owner: the document was changed or copied.", ex);
		}
		catch (GeneralSecurityException ex) {
			throw new IllegalStateException("AES-GCM is not available in this JVM.", ex);
		}
	}

	private static Cipher cipher(int mode, byte[] dek, byte[] iv, String owner, String id, int dekVersion)
			throws GeneralSecurityException {
		if (dek.length != DEK_LENGTH) {
			throw new IllegalArgumentException("A data key has " + DEK_LENGTH + " bytes, not " + dek.length + ".");
		}
		Cipher cipher = Cipher.getInstance(TRANSFORMATION);
		cipher.init(mode, new SecretKeySpec(dek, "AES"), new GCMParameterSpec(TAG_BITS, iv));
		cipher.updateAAD(("opencelium-secret:" + owner + ":" + id + ":" + dekVersion).getBytes(StandardCharsets.UTF_8));
		return cipher;
	}

}
