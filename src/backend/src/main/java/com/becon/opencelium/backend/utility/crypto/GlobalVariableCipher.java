package com.becon.opencelium.backend.utility.crypto;

import com.becon.opencelium.backend.exception.WrongDecryptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Encrypts and decrypts the values of secret global variables.
 *
 * <p>The cipher is the one of {@link Encoder}, AES with a fresh IV per value, but with a key of
 * its own: the one set in {@value #KEY_PROPERTY}, or a built-in default while that is not set or
 * blank. The key of the connectors is not used: it is copied into the database when the
 * application starts, and the key of a secret must never be there. The key is not copied
 * anywhere.
 *
 * <p>The built-in default is the same for every installation and can be read in this source, so
 * it keeps values out of sight but does not protect them from whoever has the database. A stored
 * secret can only be read with the key it was saved with: one saved under the default cannot be
 * read once an own key is set, and the other way round. Nothing this class throws or logs holds a
 * key, a stored or a plain value.
 */
@Component
public class GlobalVariableCipher {

    /** The property that holds an own key. */
    public static final String KEY_PROPERTY = "opencelium.global-variable.secret-key";

    /**
     * The environment variable that can hold the key instead. Spring's relaxed binding maps it onto
     * {@link #KEY_PROPERTY}, and it takes precedence over {@code application.yml}.
     */
    public static final String KEY_ENVIRONMENT_VARIABLE = "OPENCELIUM_GLOBALVARIABLE_SECRETKEY";

    // the same for every installation and public: it hides values, it does not protect them
    private static final String DEFAULT_KEY = "anzOGHFXaFKk/r5obCfeG0HBygJZbmS11G/AQfdq0YmX";

    private static final Logger log = LoggerFactory.getLogger(GlobalVariableCipher.class);

    private final Encoder encoder;

    // names the key in use for error messages, never its value
    private final String keyInUse;

    public GlobalVariableCipher(Environment environment) {
        String key = environment.getProperty(KEY_PROPERTY);
        boolean ownKey = key != null && !key.isBlank();
        this.encoder = new Encoder(ownKey ? key : DEFAULT_KEY);
        this.keyInUse = ownKey
                ? "the key set in " + KEY_PROPERTY
                : "the built-in default key (" + KEY_PROPERTY + " is not set)";

        if (!ownKey) {
            log.warn("Secret global variables are encrypted with the built-in default key, which is"
                    + " the same for every installation and does not protect them from whoever has"
                    + " the database. Set your own key in {} in application.yml or in the"
                    + " environment variable {} before the first secret is saved: a secret saved"
                    + " under one key cannot be read under another",
                    KEY_PROPERTY, KEY_ENVIRONMENT_VARIABLE);
        }
    }

    /** Encrypts the JSON text of a secret value with the key in use. */
    public String encrypt(String plainText) {
        return encoder.encrypt(plainText);
    }

    /**
     * Decrypts a stored secret value back to its JSON text.
     *
     * @throws WrongDecryptException if the key in use is not the one the value was saved with, or
     *                               the stored text is damaged
     */
    public String decrypt(String storedText) {
        try {
            return encoder.decrypt(storedText);
        } catch (RuntimeException e) {
            // the cause is left out: a decoding error may quote a character of the stored text
            throw new WrongDecryptException(keyInUse + " is not the one the value was saved with,"
                    + " or the stored value is damaged");
        }
    }
}
