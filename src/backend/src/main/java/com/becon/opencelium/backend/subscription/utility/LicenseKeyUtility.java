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
import java.time.*;
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
        // Convert initial date from millis to LocalDate in UTC
        LocalDate initialDate = Instant.ofEpochMilli(initialDateMillis).atZone(ZoneOffset.UTC).toLocalDate();

        // Get the day-of-month to anchor the monthly cycle
        int anchorDay = initialDate.getDayOfMonth();

        // Today's date (UTC)
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        // Use the same day-of-month as the anchor, or adjust to the last valid day of the current month
        int currentMonthDay = Math.min(anchorDay, today.lengthOfMonth());
        LocalDate startDate = LocalDate.of(today.getYear(), today.getMonth(), currentMonthDay);

        // Calculate endDate = day before same anchorDay in next month
        LocalDate nextMonth = startDate.plusMonths(1);
        int nextMonthDay = Math.min(anchorDay, nextMonth.lengthOfMonth());

        LocalDate endDate = LocalDate.of(nextMonth.getYear(), nextMonth.getMonth(), nextMonthDay).minusDays(1);

        // Convert to millis
        long startMillis = startDate.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();
        long endMillis = endDate.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant().toEpochMilli();

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
