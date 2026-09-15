package io.opencelium.core.testutil;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Throwaway keys for tests.
 *
 * <p>Generated per run on purpose: no key literal belongs in the repository, test resources
 * included (CONTRIBUTING §5.2).
 */
public final class TestKeys {

    private TestKeys() {
    }

    /** A random AES-256 key, encoded the way the master key is configured. */
    public static String base64Aes256() {
        return Base64.getEncoder().encodeToString(aes256().getEncoded());
    }

    public static SecretKey aes256() {
        try {
            KeyGenerator generator = KeyGenerator.getInstance("AES");
            generator.init(256);
            return generator.generateKey();
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("AES must be available on every JVM", ex);
        }
    }
}
