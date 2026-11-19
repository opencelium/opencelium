package com.becon.opencelium.backend.unit.utility.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.env.MockEnvironment;

/**
 * Unit tests for {@link GlobalVariableCipher}. The key comes from a {@link MockEnvironment}; no
 * Spring context is loaded.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableCipherTest"
 */
@DisplayName("GlobalVariableCipher — unit")
class GlobalVariableCipherTest {

    // built once each: deriving a key takes a while
    private static final GlobalVariableCipher CIPHER = cipherWithKey(GlobalVariableFixture.SECRET_KEY);
    private static final GlobalVariableCipher OTHER_KEY = cipherWithKey("another-key");
    private static final GlobalVariableCipher NO_KEY = new GlobalVariableCipher(new MockEnvironment());

    // ── encrypt ───────────────────────────────────────────────────────────────

    @Test
    void encryptReturnsTextThatDecryptsBackWhenKeyIsConfigured() {
        String stored = CIPHER.encrypt("{\"token\":\"s3cr3t\"}");

        assertThat(stored).doesNotContain("s3cr3t");
        assertThat(CIPHER.decrypt(stored)).isEqualTo("{\"token\":\"s3cr3t\"}");
    }

    @Test
    @DisplayName("encrypt — every value gets a fresh IV, so equal values never look equal when stored")
    void encryptReturnsDifferentTextWhenSameValueIsEncryptedTwice() {
        String first = CIPHER.encrypt("\"s3cr3t\"");
        String second = CIPHER.encrypt("\"s3cr3t\"");

        assertThat(first).isNotEqualTo(second);
    }

    @Test
    void encryptThrowsGeneralServiceExceptionWhenNoKeyIsConfigured() {
        GeneralServiceException missing =
                catchThrowableOfType(() -> NO_KEY.encrypt("\"s3cr3t\""), GeneralServiceException.class);

        assertThat(missing.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(missing.getError()).isEqualTo(GlobalVariableCipher.KEY_MISSING);
        assertThat(missing).hasMessageContaining(GlobalVariableCipher.KEY_PROPERTY);
    }

    @Test
    @DisplayName("encrypt — a key of blanks is no key")
    void encryptThrowsGeneralServiceExceptionWhenKeyIsBlank() {
        GlobalVariableCipher blankKey = cipherWithKey("   ");

        GeneralServiceException missing =
                catchThrowableOfType(() -> blankKey.encrypt("\"s3cr3t\""), GeneralServiceException.class);

        assertThat(missing.getError()).isEqualTo(GlobalVariableCipher.KEY_MISSING);
    }

    // ── decrypt ───────────────────────────────────────────────────────────────

    @Test
    void decryptThrowsWrongDecryptExceptionWhenNoKeyIsConfigured() {
        String stored = CIPHER.encrypt("\"s3cr3t\"");

        WrongDecryptException failure = catchThrowableOfType(() -> NO_KEY.decrypt(stored), WrongDecryptException.class);

        assertThat(failure).hasMessageContaining("no key is configured")
                .hasMessageContaining(GlobalVariableCipher.KEY_PROPERTY);
    }

    @Test
    @DisplayName("decrypt — the error names the key, never the stored text, and carries no cause")
    void decryptThrowsWrongDecryptExceptionWhenKeyDiffers() {
        WrongDecryptException failure = catchThrowableOfType(
                () -> OTHER_KEY.decrypt(GlobalVariableFixture.S3CR3T_ENCRYPTED), WrongDecryptException.class);

        assertThat(failure).hasMessageContaining("is not the one the value was saved with")
                .hasMessageNotContaining(GlobalVariableFixture.S3CR3T_ENCRYPTED);
        assertThat(failure.getCause()).isNull();
    }

    @Test
    @DisplayName("decrypt — a value stored in clear is refused without being quoted")
    void decryptThrowsWrongDecryptExceptionWhenTextIsNotCiphertext() {
        WrongDecryptException failure =
                catchThrowableOfType(() -> CIPHER.decrypt("\"s3cr3t\""), WrongDecryptException.class);

        assertThat(failure).hasMessageContaining("damaged").hasMessageNotContaining("s3cr3t");
        assertThat(failure.getCause()).isNull();
    }

    private static GlobalVariableCipher cipherWithKey(String key) {
        return new GlobalVariableCipher(new MockEnvironment().withProperty(GlobalVariableCipher.KEY_PROPERTY, key));
    }
}
