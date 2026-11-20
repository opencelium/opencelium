package io.opencelium.core.secrets.keys;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Instant;

import javax.crypto.AEADBadTagException;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Encrypts and decrypts the signing key with the system data key, with AES-256-GCM and a new random 12-byte IV for
 * each encryption. The purpose and the version of the signing key are authenticated as associated data, so the
 * ciphertext of a signing key does not decrypt as another value or as another version.
 */
final class SigningKeyCipher {

	private static final int IV_LENGTH = 12;

	private static final int TAG_BITS = 128;

	private static final String TRANSFORMATION = "AES/GCM/NoPadding";

	private final SecureRandom random = new SecureRandom();

	/**
	 * @param systemDek  the 32-byte system data key; the caller zeroes it after use
	 * @param signingKey the 32-byte signing key; the caller zeroes it after use
	 */
	EncryptedSigningKey encrypt(byte[] systemDek, int version, byte[] signingKey, Instant createdAt) {
		if (signingKey.length != SigningKey.LENGTH) {
			throw new IllegalArgumentException(
					"A signing key has " + SigningKey.LENGTH + " bytes, not " + signingKey.length + ".");
		}
		byte[] iv = new byte[IV_LENGTH];
		random.nextBytes(iv);
		try {
			Cipher cipher = cipher(Cipher.ENCRYPT_MODE, systemDek, iv, version);
			return new EncryptedSigningKey(null, version, iv, cipher.doFinal(signingKey), createdAt);
		}
		catch (GeneralSecurityException ex) {
			throw new IllegalStateException("AES-GCM is not available in this JVM.", ex);
		}
	}

	/**
	 * @return the 32-byte signing key; the caller zeroes it or hands it to a {@link SigningKey}
	 * @throws WrongKeyException        when {@code systemDek} did not encrypt this key, or the document was changed
	 * @throws IllegalArgumentException when the document lacks fields or has fields of the wrong length
	 */
	byte[] decrypt(byte[] systemDek, EncryptedSigningKey stored) {
		requireComplete(stored);
		try {
			Cipher cipher = cipher(Cipher.DECRYPT_MODE, systemDek, stored.iv(), stored.version());
			return cipher.doFinal(stored.ciphertext());
		}
		catch (AEADBadTagException ex) {
			throw new WrongKeyException("The system data key cannot decrypt " + stored + ".", ex);
		}
		catch (GeneralSecurityException ex) {
			throw new IllegalStateException("AES-GCM is not available in this JVM.", ex);
		}
	}

	private static void requireComplete(EncryptedSigningKey stored) {
		int ciphertextLength = SigningKey.LENGTH + TAG_BITS / 8;
		if (stored.iv() == null || stored.iv().length != IV_LENGTH) {
			throw damaged(stored, "its iv is not " + IV_LENGTH + " bytes");
		}
		if (stored.ciphertext() == null || stored.ciphertext().length != ciphertextLength) {
			throw damaged(stored, "its ciphertext is not " + ciphertextLength + " bytes");
		}
	}

	private static IllegalArgumentException damaged(EncryptedSigningKey stored, String problem) {
		return new IllegalArgumentException("Stored signing key " + stored + " is damaged: " + problem + ".");
	}

	private static Cipher cipher(int mode, byte[] systemDek, byte[] iv, int version) throws GeneralSecurityException {
		Cipher cipher = Cipher.getInstance(TRANSFORMATION);
		cipher.init(mode, new SecretKeySpec(systemDek, "AES"), new GCMParameterSpec(TAG_BITS, iv));
		cipher.updateAAD(("opencelium-signing-key:" + version).getBytes(StandardCharsets.UTF_8));
		return cipher;
	}

}
