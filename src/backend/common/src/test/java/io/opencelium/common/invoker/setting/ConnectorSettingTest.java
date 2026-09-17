package io.opencelium.common.invoker.setting;

import io.opencelium.common.invoker.schema.ScalarType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ConnectorSettingTest {

    private final String loginToken = "%{login.body.token}";

    @Test
    void constructorThrowsWhenPrivateSettingHasNoSource() {
        assertThatThrownBy(() -> new ConnectorSetting("token", ScalarType.STRING, Visibility.PRIVATE, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("setting 'token' is private, so it is never asked for and needs a source to derive it from");
    }

    @Test
    void constructorThrowsWhenSettingWithSourceIsNotPrivate() {
        assertThatThrownBy(() -> new ConnectorSetting("token", ScalarType.STRING, Visibility.PROTECTED, null, loginToken))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("setting 'token' has a source, so it is derived and must be private, not protected");
    }

    @Test
    void constructorThrowsWhenPrivateSettingHasDefault() {
        assertThatThrownBy(() -> new ConnectorSetting("token", ScalarType.STRING, Visibility.PRIVATE, "x", loginToken))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("setting 'token' is private, so its value comes from its source and cannot have a default");
    }

    @Test
    void constructorThrowsWhenNameWouldBreakPlaceholderSyntax() {
        assertThatThrownBy(() -> ConnectorSetting.ofPublic("user:name"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'user:name' is not a valid setting name; use letters, digits, '.', '_' and '-'");
    }

    @Test
    void constructorThrowsWhenSourceIsBlank() {
        assertThatThrownBy(() -> ConnectorSetting.ofPrivate("token", " "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("source of setting 'token' must not be blank");
    }

    @Test
    void constructorKeepsTheSourceExactlyAsWrittenWithoutInterpretingIt() {
        ConnectorSetting setting = ConnectorSetting.ofPrivate("token", "Bearer %{login.header.X-Token}");

        assertThat(setting.source()).isEqualTo("Bearer %{login.header.X-Token}");
    }

    @Test
    void isPromptedReturnsFalseOnlyForPrivateSettings() {
        assertThat(ConnectorSetting.ofPublic("url").isPrompted()).isTrue();
        assertThat(ConnectorSetting.ofProtected("password").isPrompted()).isTrue();
        assertThat(ConnectorSetting.ofPrivate("token", loginToken).isPrompted()).isFalse();
    }

    @Test
    void visibilityFromValueIgnoresCase() {
        assertThat(Visibility.fromValue("Protected")).isEqualTo(Visibility.PROTECTED);
    }
}
