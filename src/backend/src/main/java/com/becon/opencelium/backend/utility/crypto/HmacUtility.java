package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.utility.MachineUtility;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class HmacUtility {

    private static final String HMAC_ALGO = "HmacSHA256";
    private static final String SECRET_KEY = "my-secret-key"; // Securely manage this key

    public static String encode(String data) {
        try{
            Mac mac = Mac.getInstance(HMAC_ALGO);
            SecretKeySpec secretKeySpec = new SecretKeySpec(SECRET_KEY.getBytes(), HMAC_ALGO);
            mac.init(secretKeySpec);
            byte[] hmacBytes = mac.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(hmacBytes);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static boolean verify(String data, String hmac) {
        try {
            String computedHmac = encode(data);
            return hmac.equals(computedHmac);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public static <T extends HmacValidator> boolean verify(T data, String hmac) {
        return data.verify(hmac); // Using the object's verify method
    }
}
