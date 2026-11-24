package com.becon.opencelium.backend.unit.reference;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.reference.ReferenceMatchers;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests for how {@link ReferenceMatchers} tells a global variable reference from request
 * data, which shares its braces.
 *
 * <p>Run with: ./gradlew test --tests "*.ReferenceMatchersTest"
 */
@DisplayName("ReferenceMatchers — unit")
class ReferenceMatchersTest {

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @ValueSource(strings = {
            "{{global.x}}",
            "{{global.idoitUrl}}",
            "{{global.last_sync_2}}",
            "{{global.limits.maxPerPage}}",
            "{{global.tenants[0].id}}",
    })
    void isGlobalReturnsTrueWhenReferenceIsGlobalVariable(String reference) {
        assertThat(ReferenceMatchers.isGlobal(reference)).isTrue();
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @NullAndEmptySource
    @ValueSource(strings = {
            "{{x}}",              // no 'global.' prefix
            "{global.x}",         // single braces
            "{{global.1x}}",      // name starts with a digit
            "{{global.x}",        // one closing brace
            "a{{global.x}}",      // text before the reference
            "{{global.x}}/api",   // text after the reference
            "{{global.a}}{{global.b}}", // two references
    })
    void isGlobalReturnsFalseWhenReferenceIsNotGlobalVariable(String reference) {
        assertThat(ReferenceMatchers.isGlobal(reference)).isFalse();
    }

    @Test
    @DisplayName("isGlobal — a backslash before the braces makes the token literal text")
    void isGlobalReturnsFalseWhenTokenIsEscaped() {
        assertThat(ReferenceMatchers.isGlobal("\\{{global.x}}")).isFalse();
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @ValueSource(strings = {"{{global.x}}", "{{token}}"})
    @DisplayName("isRequestData — request data never starts on a double brace")
    void isRequestDataReturnsFalseWhenReferenceStartsWithDoubleBrace(String reference) {
        assertThat(ReferenceMatchers.isRequestData(reference)).isFalse();
    }
}
