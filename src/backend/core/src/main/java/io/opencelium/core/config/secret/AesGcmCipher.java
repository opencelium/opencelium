package io.opencelium.core.config.secret;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;

/**
 * AES-256-GCM encryption for stored secrets.
 *
 * <p>GCM is authenticated encryption: decryption verifies the data as well as decrypting it, so an
 * edit made straight in the database is detected instead of returning a wrong value.
 *
 * <p>Each value gets a fresh random IV, so storing the same password twice produces different
 * ciphertext. Callers pass associated data ("AAD") that is authenticated but not encrypted — the
 * secret store binds tenant and secret id into it, so ciphertext moved to another document or
 * another tenant fails the same check as a hand edit.
 */
public class AesGcmCipher {

    public static final String ALGORITHM = "AES-256-GCM";

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12;
    private static final int TAG_BITS = 128;

    private final SecureRandom random = new SecureRandom();

    public Encrypted encrypt(SecretKey key, byte[] plaintext, byte[] associatedData) {
        byte[] iv = new byte[IV_BYTES];
        random.nextBytes(iv);
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
            cipher.updateAAD(associatedData);
            return new Encrypted(iv, cipher.doFinal(plaintext));
        } catch (GeneralSecurityException ex) {
            // Never include the plaintext: this message can reach a log.
            throw new IllegalStateException("Failed to encrypt a secret with " + ALGORITHM, ex);
        }
    }

    /**
     * @throws GeneralSecurityException the data was altered, or the key, IV or associated data do
     *                                  not belong to this ciphertext
     */
    public byte[] decrypt(SecretKey key, byte[] iv, byte[] ciphertext, byte[] associatedData)
            throws GeneralSecurityException {
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_BITS, iv));
        cipher.updateAAD(associatedData);
        return cipher.doFinal(ciphertext);
    }

    /** One encrypted value: the IV it was encrypted with, and the ciphertext including its tag. */
    public record Encrypted(byte[] iv, byte[] ciphertext) { }
}
