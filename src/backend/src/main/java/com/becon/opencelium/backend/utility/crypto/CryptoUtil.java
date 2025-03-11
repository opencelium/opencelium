package com.becon.opencelium.backend.utility.crypto;

import javax.crypto.Cipher;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;

public class CryptoUtil {

    private static final int MAX_ENCRYPT_BLOCK = 245;  // Max block size for RSA/ECB/PKCS1Padding with a 2048-bit key

    public static byte[] decrypt(String content, String pk) {
        try {
            // Remove any extra characters (such as header, footer, or newlines) from the public key
            PublicKey publicKey = loadPublicKey(pk);

            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.DECRYPT_MODE, publicKey);

            byte[] dataBytes = Base64.getDecoder().decode(content);
            ArrayList<byte[]> decryptedChunks = new ArrayList<>();

            for (int i = 0; i < dataBytes.length; i += cipher.getOutputSize(MAX_ENCRYPT_BLOCK)) {
                int length = Math.min(cipher.getOutputSize(MAX_ENCRYPT_BLOCK), dataBytes.length - i);
                byte[] chunk = cipher.doFinal(dataBytes, i, length);
                decryptedChunks.add(chunk);
            }
            return concatChunks(decryptedChunks);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // Convert String to PublicKey
    private static PublicKey loadPublicKey(String publicKeyStr) throws Exception {
        byte[] byteKey = Base64.getDecoder().decode(publicKeyStr);
        X509EncodedKeySpec X509publicKey = new X509EncodedKeySpec(byteKey);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(X509publicKey);
    }

    private static byte[] concatChunks(ArrayList<byte[]> chunks) {
        int totalLength = 0;
        for (byte[] chunk : chunks) {
            totalLength += chunk.length;
        }

        byte[] result = new byte[totalLength];
        int offset = 0;
        for (byte[] chunk : chunks) {
            System.arraycopy(chunk, 0, result, offset, chunk.length);
            offset += chunk.length;
        }
        return result;
    }
}
