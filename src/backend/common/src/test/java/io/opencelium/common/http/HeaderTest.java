package io.opencelium.common.http;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HeaderTest {

    // ── constructor ───────────────────────────────────────

    @ParameterizedTest
    @ValueSource(strings = {"", "Content Type", "X-Token:", "\"Quoted\""})
    void constructorThrowsWhenNameIsNotAToken(String name) {
        assertThatThrownBy(() -> Header.of(name, "value"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("'" + name + "' is not a valid header name; "
                        + "a header name cannot be empty or contain spaces, colons or quotes");
    }

    @Test
    void constructorAcceptsHeaderWithoutValue() {
        assertThat(Header.of("Location", null).value()).isNull();
    }

    // ── hasName ───────────────────────────────────────────

    @Test
    void hasNameIgnoresCase() {
        assertThat(Header.of("Content-Type", "x").hasName("content-type")).isTrue();
    }

    // ── HttpMethod.fromValue ──────────────────────────────

    @Test
    void httpMethodFromValueIgnoresCase() {
        assertThat(HttpMethod.fromValue(" patch ")).isEqualTo(HttpMethod.PATCH);
    }

    @Test
    void httpMethodFromValueThrowsWhenMethodIsUnsupported() {
        assertThatThrownBy(() -> HttpMethod.fromValue("TRACE"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageStartingWith("unsupported HTTP method 'TRACE'");
    }
}
