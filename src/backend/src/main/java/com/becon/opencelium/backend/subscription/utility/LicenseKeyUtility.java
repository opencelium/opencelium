package com.becon.opencelium.backend.subscription.utility;

import com.becon.opencelium.backend.database.mysql.service.SubscriptionServiceImpl;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
    private final static Logger logger = LoggerFactory.getLogger(LicenseKeyUtility.class);

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
        if (!hmacValidator.verify(licenseKey.getHmac())) {
            logger.warn("License key is not Valid");
            return false;
        }
        if (licenseKey.getStartDate() > System.currentTimeMillis()) {
            logger.warn("Subscription will start at " + Instant.ofEpochMilli(licenseKey.getStartDate()));
            return false;
        }
        if (licenseKey.getEndDate() != 0 && licenseKey.getEndDate() < System.currentTimeMillis()) {
            logger.warn("You subscription has been expired at " + Instant.ofEpochMilli(licenseKey.getEndDate()));
            return false;
        }
        return true;
    }

    /**
     * Decrypt the provided license key string and return a LicenseKey object.
     *
     * @param encryptedLicense The encrypted license key string.
     * @return A LicenseKey object containing the decrypted data.
     * @throws Exception if decryption or JSON parsing fails.
     */
    public static LicenseKey decrypt(String encryptedLicense) {
        if (encryptedLicense == null || encryptedLicense.isEmpty()) {
            return null;
        }
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
        if (unixTimeEndDate == 0) {
            return true;
        }
        return Instant.ofEpochSecond(unixTimeEndDate).isAfter(Instant.now());
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
