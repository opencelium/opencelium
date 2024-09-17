package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.constant.AppYamlPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.crypto.*;
import javax.crypto.spec.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.spec.*;
import java.util.Base64;

@Component
public class Encoder {
    private static final String DEFAULT_SECRET_KEY = "It's a secret key";
    private static final String SALT = "opencelium-salt";
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int KEY_LENGTH = 256;
    private static final int ITERATION_COUNT = 65536;

    private final SecretKeySpec secretKeySpec;
    private final SecureRandom secureRandom;
    private final String secretKey;

    @Autowired
    public Encoder(Environment environment) {
        this.secretKey = environment.getProperty(AppYamlPath.CONNECTOR_SECRET_KEY, DEFAULT_SECRET_KEY);

        try {
            this.secretKeySpec = generateSecretKeySpec(secretKey);
            this.secureRandom = new SecureRandom();
        } catch (Exception e) {
            throw new RuntimeException("Error initializing encoder", e);
        }
    }

    public Encoder(String secretKey) {
        this.secretKey = secretKey;
        try {
            this.secretKeySpec = generateSecretKeySpec(secretKey);
            this.secureRandom = new SecureRandom();
        } catch (Exception e) {
            throw new RuntimeException("Error initializing encoder", e);
        }
    }

    private SecretKeySpec generateSecretKeySpec(String secretKey) throws NoSuchAlgorithmException, InvalidKeySpecException {
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
        KeySpec spec = new PBEKeySpec(secretKey.toCharArray(), SALT.getBytes(), ITERATION_COUNT, KEY_LENGTH);
        SecretKey tmp = factory.generateSecret(spec);
        return new SecretKeySpec(tmp.getEncoded(), "AES");
    }

    public String decrypt(String strToDecrypt) {
        try {
            byte[] encryptedData = Base64.getDecoder().decode(strToDecrypt);
            IvParameterSpec ivspec = new IvParameterSpec(encryptedData, 0, 16);  // Extract IV

            Cipher decryptCipher = Cipher.getInstance(ALGORITHM);  // Create a new Cipher instance
            decryptCipher.init(Cipher.DECRYPT_MODE, secretKeySpec, ivspec);
            byte[] decryptedText = decryptCipher.doFinal(encryptedData, 16, encryptedData.length - 16);  // Decrypt data after IV
            return new String(decryptedText, StandardCharsets.UTF_8);
        } catch (BadPaddingException e) {
            throw new RuntimeException("Decryption failed due to bad padding. Check if the key is correct.");
        } catch (IllegalBlockSizeException e) {
            throw new RuntimeException("Decryption failed due to illegal block size. Data may be corrupted.", e);
        } catch (InvalidKeyException | NoSuchAlgorithmException | NoSuchPaddingException | InvalidAlgorithmParameterException e) {
            throw new RuntimeException("Error during decryption", e);
        }
    }

    public String encrypt(String strToEncrypt) {
        try {
            byte[] iv = new byte[16];
            secureRandom.nextBytes(iv);
            IvParameterSpec ivspec = new IvParameterSpec(iv);

            Cipher encryptCipher = Cipher.getInstance(ALGORITHM);
            encryptCipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivspec);
            byte[] cipherText = encryptCipher.doFinal(strToEncrypt.getBytes(StandardCharsets.UTF_8));

            byte[] encryptedData = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, encryptedData, 0, iv.length);
            System.arraycopy(cipherText, 0, encryptedData, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(encryptedData);
        } catch (IllegalBlockSizeException | BadPaddingException e) {
            throw new RuntimeException("Encryption error. Possible padding issue.", e);
        } catch (InvalidKeyException | NoSuchAlgorithmException | NoSuchPaddingException | InvalidAlgorithmParameterException e) {
            throw new RuntimeException("Error during encryption", e);
        }
    }

    public String getSecretKey() {
        return secretKey;
    }
}
