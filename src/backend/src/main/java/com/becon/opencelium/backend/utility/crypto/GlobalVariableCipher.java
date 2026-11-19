package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Encrypts and decrypts the values of secret global variables.
 *
 * <p>The cipher is the one of {@link Encoder}, AES with a fresh IV per value, but with a key of
 * its own, read from {@value #KEY_PROPERTY}. The key of the connectors is not used: it is copied
 * into the database when the application starts, and the key of a secret must never be there.
 * The key is not copied anywhere, so a stored secret can only be read while the same key is
 * configured.
 *
 * <p>Without a key the application starts, and every variable that is not secret works: only
 * saving a secret value and reading one fail, each with an error that names the property.
 * Nothing this class throws holds a stored or a plain value.
 */
@Component
public class GlobalVariableCipher {

    /** The property that holds the key. */
    public static final String KEY_PROPERTY = "opencelium.global-variable.secret-key";

    /** Error code of a secret that cannot be saved because no key is configured. */
    public static final String KEY_MISSING = "GLOBAL_VARIABLE_SECRET_KEY_MISSING";

    private static final Logger log = LoggerFactory.getLogger(GlobalVariableCipher.class);

    // null when no key is configured
    private final Encoder encoder;

    public GlobalVariableCipher(Environment environment) {
        String key = environment.getProperty(KEY_PROPERTY);
        boolean configured = key != null && !key.isBlank();
        this.encoder = configured ? new Encoder(key) : null;

        if (!configured) {
            log.info("Secret global variables cannot be saved or read until {} is set", KEY_PROPERTY);
        }
    }

    /**
     * Encrypts the JSON text of a secret value.
     *
     * @throws GeneralServiceException with status 500 and code {@value #KEY_MISSING} if no key is
     *                                 configured
     */
    public String encrypt(String plainText) {
        if (encoder == null) {
            throw new GeneralServiceException(HttpStatus.INTERNAL_SERVER_ERROR, KEY_MISSING,
                    "Secret values cannot be saved: set " + KEY_PROPERTY + " in application.yml");
        }

        return encoder.encrypt(plainText);
    }

    /**
     * Decrypts a stored secret value back to its JSON text.
     *
     * @throws WrongDecryptException if no key is configured, or the configured key is not the one
     *                               the value was saved with, or the stored text is damaged
     */
    public String decrypt(String storedText) {
        if (encoder == null) {
            throw new WrongDecryptException("no key is configured, set " + KEY_PROPERTY + " in application.yml");
        }

        try {
            return encoder.decrypt(storedText);
        } catch (RuntimeException e) {
            // the cause is left out: a decoding error may quote a character of the stored text
            throw new WrongDecryptException("the configured key " + KEY_PROPERTY
                    + " is not the one the value was saved with, or the stored value is damaged");
        }
    }
}
