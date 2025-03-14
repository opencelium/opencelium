package com.becon.opencelium.backend.subscription.utility;

import com.becon.opencelium.backend.constant.SubscriptionConstant;
import com.becon.opencelium.backend.subscription.dto.LicenseKey;
import com.becon.opencelium.backend.utility.crypto.CryptoUtil;
import com.becon.opencelium.backend.utility.crypto.HmacValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.crypto.Cipher;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Base64;

import static com.becon.opencelium.backend.constant.SecurityConstant.PUBLIC_KEY;

public class LicenseKeyUtility {
    private static final int MAX_ENCRYPT_BLOCK = 245;  // Max block size for RSA/ECB/PKCS1Padding with a 2048-bit key
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
            logger.error("License key is not Valid");
            return false;
        }
        if (licenseKey.getStartDate() > System.currentTimeMillis()) {
            throw new RuntimeException("Subscription will start at " + Instant.ofEpochMilli(licenseKey.getStartDate()));
        }
        if (licenseKey.getEndDate() != 0 && licenseKey.getEndDate() < System.currentTimeMillis()) {
            throw new RuntimeException("You subscription has been expired at " + Instant.ofEpochMilli(licenseKey.getEndDate()));
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
            byte[] decryptedData = CryptoUtil.decrypt(encryptedLicense, PUBLIC_KEY);
            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.readValue(decryptedData, LicenseKey.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static String getPublicKey(Path path) {
        return PUBLIC_KEY;
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

    public static MonthPeriod getCurrentMonthPeriod(long initialDateMillis) {
        // Convert initial date from UNIX milliseconds to LocalDateTime in UTC
        Instant initialInstant = Instant.ofEpochMilli(initialDateMillis);
        LocalDateTime initialDate = LocalDateTime.ofInstant(initialInstant, ZoneOffset.UTC);

        // Get the current date in UTC
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

        // Determine the start of the period (same day as initialDate in the current month)
        LocalDateTime startDate = now.withDayOfMonth(initialDate.getDayOfMonth()).with(LocalTime.MIN);

        // If the startDate is in the future (because the current month has fewer days), move to last valid day
        if (startDate.getDayOfMonth() != initialDate.getDayOfMonth()) {
            startDate = startDate.with(TemporalAdjusters.lastDayOfMonth());
        }

        // Determine the end of the period (same day next month or the last day of the month)
        LocalDateTime endDate = startDate.plusMonths(1).minusSeconds(1);

        // Convert to UNIX timestamp in milliseconds
        long startMillis = startDate.toInstant(ZoneOffset.UTC).toEpochMilli();
        long endMillis = endDate.toInstant(ZoneOffset.UTC).toEpochMilli();

        return new MonthPeriod(startMillis, endMillis);
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
