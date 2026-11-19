package com.becon.opencelium.backend.unit.reference;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.reference.GlobalEscape;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests for {@link GlobalEscape}: finding, hiding and unescaping the escaped global variable
 * token {@code \{{global.name}}}.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalEscapeTest"
 */
@DisplayName("GlobalEscape — unit")
class GlobalEscapeTest {

    @Test
    void isPresentReturnsTrueWhenTextHoldsEscapedToken() {
        boolean present = GlobalEscape.isPresent("Bearer \\{{global.apiKey}}");

        assertThat(present).isTrue();
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @NullSource
    @ValueSource(strings = {
            "{{global.x}}",     // a reference: nothing escapes it
            "\\{global.x}",     // a backslash before a single brace
            "\\{{global.}}",    // starts like an escaped token, but names no variable
    })
    void isPresentReturnsFalseWhenNoTokenIsEscaped(String text) {
        boolean present = GlobalEscape.isPresent(text);

        assertThat(present).isFalse();
    }

    @Test
    @DisplayName("mask — only the escaped token is blanked, so a position in the result is one in the text")
    void maskKeepsLengthWhenTokenIsBlanked() {
        String text = "{{global.a}} \\{{global.b}} end";

        String masked = GlobalEscape.mask(text);

        assertThat(masked)
                .hasSameSizeAs(text)
                .isEqualTo("{{global.a}} " + " ".repeat("\\{{global.b}}".length()) + " end");
    }

    @Test
    void unescapeRemovesBackslashWhenTokenIsEscaped() {
        String text = "\\{{global.x}} and \\{{global.tenants[0].id}}, twice \\{{global.x}}";

        String unescaped = GlobalEscape.unescape(text);

        assertThat(unescaped).isEqualTo("{{global.x}} and {{global.tenants[0].id}}, twice {{global.x}}");
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @ValueSource(strings = {
            "C:\\temp\\{name}",     // backslashes of a path and before a single brace
            "\\{{other.x}}",        // double braces that hold no global variable
            "\\{{global.}}",        // starts like an escaped token, but names no variable
            "a\\\\b {{global.x}}",  // a reference next to backslashes
    })
    void unescapeKeepsBackslashWhenItEscapesNothing(String text) {
        String unescaped = GlobalEscape.unescape(text);

        assertThat(unescaped).isEqualTo(text);
    }

    @Test
    void tokensInReturnsEachTokenOnceWhenItRepeats() {
        List<String> tokens = GlobalEscape.tokensIn("\\{{global.a}} \\{{global.b.c}} \\{{global.a}} {{global.d}}");

        assertThat(tokens).containsExactly("\\{{global.a}}", "\\{{global.b.c}}");
    }
}
