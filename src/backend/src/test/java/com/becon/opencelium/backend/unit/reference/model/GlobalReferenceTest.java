package com.becon.opencelium.backend.unit.reference.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.reference.enums.ReferenceType;
import com.becon.opencelium.backend.reference.model.GlobalReference;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * Unit tests for {@link GlobalReference}.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalReferenceTest"
 */
@DisplayName("GlobalReference — unit")
class GlobalReferenceTest {

    @Test
    void parseReturnsNameWhenReferenceHasNoPath() {
        GlobalReference reference = GlobalReference.parse("{{global.idoitUrl}}");

        assertThat(reference.getType()).isEqualTo(ReferenceType.GLOBAL);
        assertThat(reference.getRaw()).isEqualTo("{{global.idoitUrl}}");
        assertThat(reference.getName()).isEqualTo("idoitUrl");
        assertThat(reference.getPath()).isEmpty();
    }

    @Test
    @DisplayName("parse — the dot between the name and the path is not part of the path")
    void parseReturnsFieldPathWhenPathFollowsDot() {
        GlobalReference reference = GlobalReference.parse("{{global.limits.maxPerPage}}");

        assertThat(reference.getName()).isEqualTo("limits");
        assertThat(reference.getPath()).contains("maxPerPage");
    }

    @Test
    void parseReturnsIndexPathWhenPathStartsWithBracket() {
        GlobalReference reference = GlobalReference.parse("{{global.tenants[0].id}}");

        assertThat(reference.getName()).isEqualTo("tenants");
        assertThat(reference.getPath()).contains("[0].id");
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @ValueSource(strings = {
            "{{idoitUrl}}",          // no 'global.' prefix
            "{global.idoitUrl}",     // single braces
            "{{global.}}",           // no name
            "{{global.1st}}",        // name starts with a digit
            "{{global.has-dash}}",   // character outside letters, digits and '_'
            "x{{global.idoitUrl}}",  // text before the reference
            "{{global.idoitUrl}}/x", // text after the reference
            "\\{{global.idoitUrl}}", // escaped: literal text
    })
    void parseThrowsIllegalArgumentExceptionWhenSyntaxIsInvalid(String raw) {
        assertThatThrownBy(() -> GlobalReference.parse(raw))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid syntax for GLOBAL reference")
                .hasMessageContaining(raw);
    }

    @ParameterizedTest(name = "[{index}] \"{0}\"")
    @ValueSource(strings = {"{{global.limits.}}", "{{global.limits. }}"})
    void parseThrowsIllegalArgumentExceptionWhenPathIsEmpty(String raw) {
        assertThatThrownBy(() -> GlobalReference.parse(raw))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Empty path in GLOBAL reference")
                .hasMessageContaining(raw);
    }

    @Test
    void parseThrowsNullPointerExceptionWhenReferenceIsNull() {
        assertThatThrownBy(() -> GlobalReference.parse(null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("null is not a reference");
    }
}
