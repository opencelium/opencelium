package io.opencelium.core.config.secret;

import io.opencelium.core.config.SecurityProperties;
import io.opencelium.core.testutil.TestKeys;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.assertj.core.api.Assertions.catchThrowable;

class MasterKeyTest {

    private static final String NOT_BASE64 = "definitely not base64 canary-8f31c2a7";

    @Test
    void keyIsUsableWhenTheConfiguredValueIsBase64EncodedAes256() {
        MasterKey masterKey = new MasterKey(properties(TestKeys.base64Aes256()));

        assertThat(masterKey.key().getEncoded()).hasSize(32);
        assertThat(masterKey.keyId()).isEqualTo(MasterKey.CURRENT_KEY_ID);
    }

    @Test
    void constructorThrowsNamingThePropertyWhenTheValueIsNotBase64() {
        assertThatIllegalStateException()
                .isThrownBy(() -> new MasterKey(properties(NOT_BASE64)))
                .withMessageContaining(MasterKey.PROPERTY);
    }

    @Test
    void constructorFailureNeverContainsTheConfiguredValue() {
        Throwable failure = catchThrowable(() -> new MasterKey(properties(NOT_BASE64)));

        assertThat(failure).isNotNull();
        assertThat(stackTraceOf(failure)).doesNotContain("canary");
    }

    @Test
    void constructorThrowsNamingThePropertyWhenTheKeyIsTooShort() {
        String sixteenBytes = Base64.getEncoder().encodeToString(new byte[16]);

        assertThatIllegalStateException()
                .isThrownBy(() -> new MasterKey(properties(sixteenBytes)))
                .withMessageContaining(MasterKey.PROPERTY)
                .withMessageContaining("32 bytes");
    }

    @Test
    void toStringHidesTheKey() {
        assertThat(new MasterKey(properties(TestKeys.base64Aes256())).toString()).isEqualTo("MasterKey[***]");
    }

    private static SecurityProperties properties(String masterKey) {
        return new SecurityProperties(masterKey, SecurityProperties.Provider.MONGO);
    }

    private static String stackTraceOf(Throwable failure) {
        StringWriter writer = new StringWriter();
        failure.printStackTrace(new PrintWriter(writer));
        return writer.toString();
    }
}
