package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.license.AesEncryptable;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public final class AESUtility {

    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES";
    private static final String SECRET_KEY = "secret_key_12345"; // 16-byte key for AES-128

    private AESUtility() {
    }

    public static String encrypt(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM));
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes());
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            return null;
        }
    }

    public static String decrypt(String encryptedText) {
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(SECRET_KEY.getBytes(), ALGORITHM));
            byte[] decodedBytes = Base64.getDecoder().decode(encryptedText);
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);
            return new String(decryptedBytes);
        } catch (Exception e) {
            return null;
        }
    }

    public static <T extends AesEncryptable> String encrypt(T obj) {
        return encrypt(obj.getAsJson());
    }

    public static AesEncryptable decrypt(String plainText, Class<? extends AesEncryptable> clazz) {
        ObjectMapper objectMapper = new ObjectMapper();
        String decrypted = decrypt(plainText);
        try {
            return objectMapper.readValue(decrypted,clazz);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }
}

