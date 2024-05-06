package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.constant.YamlPropConst;
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
    private final Cipher cipher;
    private final SecureRandom secureRandom;

    public Encoder(Environment environment) {
        String secretKey = environment.getProperty(YamlPropConst.CONNECTOR_SECRET_KEY, DEFAULT_SECRET_KEY);

        try {
            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
            KeySpec spec = new PBEKeySpec(secretKey.toCharArray(), SALT.getBytes(), ITERATION_COUNT, KEY_LENGTH);
            SecretKey tmp = factory.generateSecret(spec);
            secretKeySpec = new SecretKeySpec(tmp.getEncoded(), "AES");

            cipher = Cipher.getInstance(ALGORITHM);
            secureRandom = new SecureRandom();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException | NoSuchPaddingException e) {
            throw new RuntimeException("Error initializing encoder", e);
        }
    }

    public String decrypt(String strToDecrypt) {
        try {
            byte[] encryptedData = Base64.getDecoder().decode(strToDecrypt);
            IvParameterSpec ivspec = new IvParameterSpec(encryptedData, 0, 16);

            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, ivspec);
            byte[] decryptedText = cipher.doFinal(encryptedData, 16, encryptedData.length - 16);
            return new String(decryptedText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String encrypt(String strToEncrypt) {
        try {
            byte[] iv = new byte[16];
            secureRandom.nextBytes(iv);
            IvParameterSpec ivspec = new IvParameterSpec(iv);

            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, ivspec);
            byte[] cipherText = cipher.doFinal(strToEncrypt.getBytes(StandardCharsets.UTF_8));

            byte[] encryptedData = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, encryptedData, 0, iv.length);
            System.arraycopy(cipherText, 0, encryptedData, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(encryptedData);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
