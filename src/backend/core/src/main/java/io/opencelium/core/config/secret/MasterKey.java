package io.opencelium.core.config.secret;

import io.opencelium.core.config.SecurityProperties;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Component
public class MasterKey {

    /** Identifies which key encrypted a document, so keys can be rotated later without rewrites. */
    public static final String CURRENT_KEY_ID = "v1";

    static final String PROPERTY = "opencelium.security.master-key";
    private static final int REQUIRED_BYTES = 32;
    private static final String HINT = "; generate one with: openssl rand -base64 32";

    private final SecretKey key;

    public MasterKey(SecurityProperties properties) {
        this.key = decode(properties.masterKey());
    }

    private static SecretKey decode(String configured) {
        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(configured.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException(PROPERTY + " must be Base64 encoded" + HINT, ex);
        }
        if (decoded.length != REQUIRED_BYTES) {
            throw new IllegalStateException(PROPERTY + " must decode to exactly " + REQUIRED_BYTES
                    + " bytes for AES-256, but decoded to " + decoded.length + " bytes" + HINT);
        }
        return new SecretKeySpec(decoded, "AES");
    }

    public SecretKey key() {
        return key;
    }

    public String keyId() {
        return CURRENT_KEY_ID;
    }

    @Override
    public String toString() {
        return "MasterKey[***]";
    }
}
