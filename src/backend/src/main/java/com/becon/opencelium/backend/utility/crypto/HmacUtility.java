package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.license.HmacValidator;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class HmacUtility {
    private static final String SECRET_KEY = "zrOCf7Tg/YD1MsCfPvSIZ9UqkJIq0clFIUm4OC1cscJTR4w3WAIVzK/vVgH3bQKEUNylkavS3KTkwkHWLONLEy8xDLfNLipzUmlnBuWosQDdXyhY/xl9pytU4UE/vWkR";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private HmacUtility() {
    }

    public static String encode(String data) {
        if (data == null) {
            return null;
        }
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(SECRET_KEY.getBytes(), HMAC_ALGORITHM);

            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(secretKeySpec);

            byte[] hmacBytes = mac.doFinal(data.getBytes());

            return Base64.getEncoder().encodeToString(hmacBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static boolean verify(String data, String hmac) {
        try {
            String generatedHmac = encode(data);

            return generatedHmac != null && generatedHmac.equals(hmac);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static <T extends HmacValidator> boolean verify(T data, String hmac) {
        return data.verify(hmac);
    }
}
