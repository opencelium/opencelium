package com.becon.opencelium.backend.subscription.utility;

import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.constant.SubscriptionConstant;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import javax.crypto.Cipher;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.stream.Collectors;

public class LicenseKeyUtility {
    private static final String ENCRYPTION_ALGO = "RSA";
    private static final String PUBLIC_KEY ="MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAnj2andeiYdgRAp1jkLej" +
            "/xgslVEN+qodRNjguHNBV2gKHim9VXCvakAZveUqXN7/L7R+wlDrlnjLDWV5cN4a" +
            "WDQFPKK0YcH+A1oSI7m/SbBaeyQSwH5PT/kYG0AU3C1FItoshhDKDhvSMk5iUJc6" +
            "6ZXRg4xBH9x3jOfKHRrvJlLRx8NX+WLPJNLpVog/an2lmDqWw2AsJYgf8p18baCa" +
            "vHKil39e8gDNizAQhQdC1yEK4RLgtsmGFGnrhCjNaZ/+NriYE4D/CK71QT4d//eF" +
            "4LNgBqIGEPRb4ekt9qUH2T6F5XqiR90BFRLTyMv0ASos+k25GQqHS7WRjUHUOu0F" +
            "1UL9POtjLCVj39q9U9ip6G3UYTNJ7gF6wUpzwmqQuLID4Bx3YOT7GeaiPc2AdlQl" +
            "T5MbFSBMqHXcsScHfEQU2IPb2iYowLoKH7nqrCHOtR83/CDbzKKCHm0R072QmFh+" +
            "67YPL3U1Vg+zrT4emlEYSM3gdOrcb4Wgm85+sUs3aoWmRPsDITUG+vqAbZ2C/gxg" +
            "EmlVZzbKgH4NpFIO/eh7oW7cWXyJ+2Fc07T/NRs1UBAR6cjpZBFeVKIgIsWay6sF" +
            "ffOyv1lUM0DRvtM53BgaXV2V5TUbOzKlM+d2jBqlrCeq6TpJVG6FCrJsaaOgSq6Z" +
            "gt5JLtdbtZqZtnYndk3FT78CAwEAAQ==";
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

    public static String readFreeLicense() {
        return SubscriptionConstant.FREE_LICENSE;

//        ResourceLoader resourceLoader = new DefaultResourceLoader();
//        // Load the file from resources/license/ folder
//        Resource resource = resourceLoader.getResource("classpath:license/init-license.txt");
//
//        // Use InputStream to read the content of the file
//        InputStream inputStream = resource.getInputStream();
//
//        // Using BufferedReader and InputStreamReader to read the file content
//        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
//            // Collect all lines into a single string without adding '\n'
//            return reader.lines().collect(Collectors.joining());
//        }
    }
}
