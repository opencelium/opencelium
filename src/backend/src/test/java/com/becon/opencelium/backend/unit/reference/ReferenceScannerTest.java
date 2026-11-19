package com.becon.opencelium.backend.unit.reference;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.reference.ReferenceScanner;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for how {@link ReferenceScanner} extracts a global variable reference next to the
 * other reference types.
 *
 * <p>Run with: ./gradlew test --tests "*.ReferenceScannerTest"
 */
@DisplayName("ReferenceScanner — unit")
class ReferenceScannerTest {

    @Test
    @DisplayName("extract — a global variable is one reference, not request data inside braces")
    void extractReturnsGlobalReferenceWholeWhenTextHoldsOne() {
        List<String> references = ReferenceScanner.extract("{{global.idoitUrl}}/api/{tenant}");

        assertThat(references).containsExactly("{{global.idoitUrl}}", "{tenant}");
    }

    @Test
    @DisplayName("extract — an escaped token is literal text: no reference is found in it")
    void extractReturnsNothingWhenGlobalTokenIsEscaped() {
        List<String> references = ReferenceScanner.extract("\\{{global.idoitUrl}}");

        assertThat(references).isEmpty();
    }

    @Test
    void extractKeepsWrappedDirectReferenceWhenGlobalStandsNextToIt() {
        List<String> references =
                ReferenceScanner.extract("{{global.prefix}}{%#ababab.(response).body.$.id%}");

        assertThat(references)
                .containsExactly("{{global.prefix}}", "{%#ababab.(response).body.$.id%}");
    }
}
