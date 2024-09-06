package com.becon.opencelium.backend.subscription.utility;

import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.Date;
import java.util.List;

public class LicenseKeyUtility {
    private static final String ENCRYPTION_ALGO = "RSA";
    private static final String PUBLIC_KEY ="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAySXNCZthSV2xdfPVCoXdmQpmoEDli2ry85AJW28ouGby5b/pUMlgc3v0gCXiLK1w7s9lEM5HkRXogtLGJkWsvKWl6cPo6a/Oeh0vHC2R9VuC1z1xXHpiVo8b0QNcFC+sN93Hi33i0+X4Dqm7qR2v3eAQ6eeSccVsaaSyT8HjTds9rGKHx465iC9ZpPdCBtY7Gfo+Jj/IzJHU0pT4vZCXy4sicjd3TV+rBrFc1I6pMePfbqRN452H9Df6qbHqOFa+h/D1NO0egQ2Dzkdehx+N4/7cOmtePts5D0D6G1pUOWD7L2fTMXcYaWlmsifW+N/A9RPGpI7M5dVu06vOiCrj6wIDAQAB";

    // TODO: create chain of responsibility for different verifications.
    public static boolean verify(String licenseKey, HmacValidator hmacValidator) {
        // Example: check format, signature, and expiration
        if (licenseKey == null || licenseKey.isEmpty()) {
            return false;
        }

        LicenseKey lk = LicenseKeyUtility.decrypt(licenseKey);
        return verify(lk, hmacValidator);
    }

    public static boolean verify(LicenseKey licenseKey, HmacValidator hmacValidator) {
        if (licenseKey == null) {
            return false;
        }
        return isEndDateValid(licenseKey.getEndDate()) && !hmacValidator.verify(licenseKey.getHmac());
    }

    /**
     * Decrypt the provided license key string and return a LicenseKey object.
     *
     * @param encryptedLicense The encrypted license key string.
     * @return A LicenseKey object containing the decrypted data.
     * @throws Exception if decryption or JSON parsing fails.
     */
    public static LicenseKey decrypt(String encryptedLicense) {
        try {
            // Remove any extra characters (such as header, footer, or newlines) from the public key
            PublicKey publicKey = stringToPublicKey(PUBLIC_KEY);

            Cipher cipher = Cipher.getInstance("RSA/ECB/PKCS1Padding");
            cipher.init(Cipher.DECRYPT_MODE, publicKey);
            byte[] licenseKeyBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedLicense));
            System.out.println(new String(licenseKeyBytes));
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(licenseKeyBytes, LicenseKey.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String getPublicKey(Path path) {
        return "Key";
    }

    private static boolean isEndDateValid(long unixTimeEndDate) {
        // Get the current date-time using LocalDateTime
        LocalDateTime currentDateTime = LocalDateTime.now();

        // Convert Unix time (epoch time) to LocalDateTime
        LocalDateTime unixDateTime = Instant.ofEpochMilli(unixTimeEndDate)
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        return currentDateTime.isBefore(unixDateTime);
    }

    private static boolean verifyPublicKey(String licenseKey) {

        return false;
    }

    // Convert String to PublicKey
    private static PublicKey stringToPublicKey(String publicKeyStr) throws Exception {
        byte[] byteKey = Base64.getDecoder().decode(publicKeyStr);
        X509EncodedKeySpec X509publicKey = new X509EncodedKeySpec(byteKey);
        KeyFactory keyFactory = KeyFactory.getInstance("RSA");
        return keyFactory.generatePublic(X509publicKey);
    }
}
