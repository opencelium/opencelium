package com.becon.opencelium.backend.unit.utility.crypto;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.becon.opencelium.backend.exception.WrongDecryptException;
import com.becon.opencelium.backend.testutil.fixture.GlobalVariableFixture;
import com.becon.opencelium.backend.utility.crypto.GlobalVariableCipher;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.mock.env.MockEnvironment;

/**
 * Unit tests for {@link GlobalVariableCipher}. The key comes from a {@link MockEnvironment}, or,
 * for the environment variable, from a {@link StandardEnvironment} whose system environment is
 * replaced and which resolves names as Spring Boot does; no Spring context is loaded. A Logback
 * {@link ListAppender} on the cipher's logger captures the start-up warning, which is the
 * contract that tells an admin the built-in default key is in use.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalVariableCipherTest"
 */
@DisplayName("GlobalVariableCipher — unit")
class GlobalVariableCipherTest {

    private static final String S3CR3T = "\"s3cr3t\"";

    // built once each: deriving a key takes a while
    private static final GlobalVariableCipher CIPHER = cipherWithKey(GlobalVariableFixture.SECRET_KEY);
    private static final GlobalVariableCipher OTHER_KEY = cipherWithKey("another-key");
    private static final GlobalVariableCipher DEFAULT_KEY = new GlobalVariableCipher(new MockEnvironment());

    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        appender = new ListAppender<>();
        appender.start();
        cipherLogger().addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        cipherLogger().detachAppender(appender);
    }

    // ── encrypt ───────────────────────────────────────────────────────────────

    @Test
    void encryptReturnsTextThatDecryptsBackWhenKeyIsConfigured() {
        String stored = CIPHER.encrypt("{\"token\":\"s3cr3t\"}");

        assertThat(stored).doesNotContain("s3cr3t");
        assertThat(CIPHER.decrypt(stored)).isEqualTo("{\"token\":\"s3cr3t\"}");
    }

    @Test
    @DisplayName("encrypt — without an own key the built-in default is used, the same in every cipher,"
            + " so a value saved before a restart is read after it")
    void encryptReturnsTextThatDecryptsBackWhenNoKeyIsConfigured() {
        String stored = DEFAULT_KEY.encrypt("{\"token\":\"s3cr3t\"}");
        GlobalVariableCipher afterRestart = new GlobalVariableCipher(new MockEnvironment());

        assertThat(stored).doesNotContain("s3cr3t");
        assertThat(afterRestart.decrypt(stored)).isEqualTo("{\"token\":\"s3cr3t\"}");
    }

    @Test
    @DisplayName("encrypt — every value gets a fresh IV, so equal values never look equal when stored")
    void encryptReturnsDifferentTextWhenSameValueIsEncryptedTwice() {
        String first = CIPHER.encrypt(S3CR3T);
        String second = CIPHER.encrypt(S3CR3T);

        assertThat(first).isNotEqualTo(second);
    }

    // ── decrypt ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("decrypt — a key of blanks is no own key: the built-in default is used")
    void decryptReadsDefaultKeyValueWhenKeyIsBlank() {
        String stored = DEFAULT_KEY.encrypt(S3CR3T);
        GlobalVariableCipher blankKey = cipherWithKey("   ");

        assertThat(blankKey.decrypt(stored)).isEqualTo(S3CR3T);
    }

    @Test
    @DisplayName("decrypt — with the built-in default in use, a value saved under an own key is refused")
    void decryptThrowsWrongDecryptExceptionWhenDefaultKeyReadsOwnKeyValue() {
        WrongDecryptException failure = catchThrowableOfType(
                () -> DEFAULT_KEY.decrypt(GlobalVariableFixture.S3CR3T_ENCRYPTED), WrongDecryptException.class);

        assertThat(failure).hasMessageContaining("built-in default key")
                .hasMessageContaining(GlobalVariableCipher.KEY_PROPERTY);
    }

    @Test
    @DisplayName("decrypt — once an own key is set, a value saved under the built-in default is refused")
    void decryptThrowsWrongDecryptExceptionWhenOwnKeyReadsDefaultKeyValue() {
        WrongDecryptException failure = catchThrowableOfType(
                () -> CIPHER.decrypt(GlobalVariableFixture.S3CR3T_ENCRYPTED_WITH_DEFAULT_KEY),
                WrongDecryptException.class);

        assertThat(failure).hasMessageContaining("the key set in " + GlobalVariableCipher.KEY_PROPERTY);
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
                catchThrowableOfType(() -> CIPHER.decrypt(S3CR3T), WrongDecryptException.class);

        assertThat(failure).hasMessageContaining("damaged").hasMessageNotContaining("s3cr3t");
        assertThat(failure.getCause()).isNull();
    }

    // ── key from the environment variable ─────────────────────────────────────

    @Test
    @DisplayName("decrypt — KEY_ENVIRONMENT_VARIABLE is the name Spring Boot maps onto the property")
    void decryptReturnsPlainTextWhenKeyComesFromEnvironmentVariable() {
        GlobalVariableCipher fromVariable = cipherFrom(
                Map.of(GlobalVariableCipher.KEY_ENVIRONMENT_VARIABLE, GlobalVariableFixture.SECRET_KEY), Map.of());

        assertThat(fromVariable.decrypt(GlobalVariableFixture.S3CR3T_ENCRYPTED)).isEqualTo(S3CR3T);
    }

    @Test
    @DisplayName("decrypt — the empty secret-key of application_default.yml does not hide the variable")
    void decryptReturnsPlainTextWhenEnvironmentVariableOverridesEmptyFileValue() {
        GlobalVariableCipher fromVariable = cipherFrom(
                Map.of(GlobalVariableCipher.KEY_ENVIRONMENT_VARIABLE, GlobalVariableFixture.SECRET_KEY),
                Map.of(GlobalVariableCipher.KEY_PROPERTY, ""));

        assertThat(fromVariable.decrypt(GlobalVariableFixture.S3CR3T_ENCRYPTED)).isEqualTo(S3CR3T);
    }

    @Test
    @DisplayName("decrypt — a variable that is set but empty means the built-in default,"
            + " even over a key in the file")
    void decryptReadsDefaultKeyValueWhenEnvironmentVariableIsEmpty() {
        String stored = DEFAULT_KEY.encrypt(S3CR3T);
        GlobalVariableCipher emptyVariable = cipherFrom(
                Map.of(GlobalVariableCipher.KEY_ENVIRONMENT_VARIABLE, ""),
                Map.of(GlobalVariableCipher.KEY_PROPERTY, GlobalVariableFixture.SECRET_KEY));

        assertThat(emptyVariable.decrypt(stored)).isEqualTo(S3CR3T);
    }

    // ── start-up warning ──────────────────────────────────────────────────────

    @Test
    @DisplayName("constructor — without an own key one WARN names the property and the environment variable")
    void constructorLogsWarningWhenNoKeyIsConfigured() {
        new GlobalVariableCipher(new MockEnvironment());

        assertThat(appender.list).singleElement().satisfies(event -> {
            assertThat(event.getLevel()).isEqualTo(Level.WARN);
            assertThat(event.getFormattedMessage()).contains(GlobalVariableCipher.KEY_PROPERTY)
                    .contains(GlobalVariableCipher.KEY_ENVIRONMENT_VARIABLE);
        });
    }

    @Test
    void constructorLogsNothingWhenOwnKeyIsSet() {
        cipherWithKey("another-key");

        assertThat(appender.list).isEmpty();
    }

    private static Logger cipherLogger() {
        return (Logger) LoggerFactory.getLogger(GlobalVariableCipher.class);
    }

    private static GlobalVariableCipher cipherWithKey(String key) {
        return new GlobalVariableCipher(new MockEnvironment().withProperty(GlobalVariableCipher.KEY_PROPERTY, key));
    }

    /**
     * A cipher built from an environment with the given environment variables and, below them, the
     * given entries of {@code application.yml}, resolved through Spring Boot's relaxed binding.
     */
    private static GlobalVariableCipher cipherFrom(Map<String, Object> variables, Map<String, Object> file) {
        StandardEnvironment environment = new StandardEnvironment();
        MutablePropertySources sources = environment.getPropertySources();
        String name = StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME;
        sources.replace(name, new SystemEnvironmentPropertySource(name, variables));
        sources.addLast(new MapPropertySource("application.yml", file));
        ConfigurationPropertySources.attach(environment);

        return new GlobalVariableCipher(environment);
    }
}
