package com.becon.opencelium.backend.utility;

import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.license.LicenseKey;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class LicenseKeyUtility {
    private static String secretKey;
    private static final ObjectMapper mapper = new ObjectMapper();

    static {
        setSecretKey();
        SimpleModule module = new SimpleModule();
        module.addSerializer(Instant.class, new InstantSerializer());
        module.addDeserializer(Instant.class, new InstantDeserializer());
        mapper.registerModule(module);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    }
    private LicenseKeyUtility() {
    }

    private static void setSecretKey() {
        List<String> lines = null;
        try {
            lines = Files.readAllLines(Paths.get(PathConstant.PUBLIC_KEY_FILE).toAbsolutePath());
        } catch (IOException e) {
            e.printStackTrace();
            secretKey = "secret_key_12345";
            return;
        }

        secretKey = lines.stream()
                .skip(1)
                .limit(lines.size() - 2)
                .collect(Collectors.joining());
    }

    public static boolean verify(String licenseKeyRaw) {
        LicenseKey licenseKey = decrypt(licenseKeyRaw);

        if (licenseKey == null) {
            return false;
        }

        if (licenseKey.getSubId() == null) {
            return false;
        } else {
            try {
                UUID.fromString(licenseKey.getSubId());
            } catch (Exception e) {
                return false;
            }
        }
        if (licenseKey.getStartDate() == null || licenseKey.getEndDate() == null || licenseKey.getHmac() == null) {
            return false;
        }

        if (licenseKey.getStartDate().isAfter(Instant.now()) || licenseKey.getEndDate().isBefore(Instant.now())) {
            return false;
        }
        return true;
    }

    public static LicenseKey decrypt(String data) {
        // todo: using AES algorithm, need to be changed
        String lkRaw;
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(), "AES");
        Cipher cipher;
        try {
            cipher = Cipher.getInstance("AES");
            cipher.init(Cipher.DECRYPT_MODE, keySpec);
            byte[] decodedBytes = Base64.getDecoder().decode(data);
            byte[] decryptedBytes = cipher.doFinal(decodedBytes);
            lkRaw = new String(decryptedBytes);
        } catch (Exception e) {
            return null;
        }

        try {
            return mapper.convertValue(lkRaw, LicenseKey.class);
        } catch (Exception e) {
            return null;
        }
    }
}
