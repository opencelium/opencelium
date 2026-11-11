package com.becon.opencelium.backend.unit.execution.oc721;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.becon.opencelium.backend.execution.oc721.Extractor;
import com.becon.opencelium.backend.execution.oc721.StaticValueExtractor;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link StaticValueExtractor}. The connector side is a fake that echoes the
 * reference it was asked for.
 */
@DisplayName("StaticValueExtractor — unit")
class StaticValueExtractorTest {

    private static final String DIRECT_REF = "#c0ffee.(response).id";
    private static final String TOKEN_REF = "{token}";

    private final Extractor connector = reference -> "connector:" + reference;

    @Test
    void extractValueReturnsStaticValueWhenReferenceHasOne() {
        StaticValueExtractor extractor = new StaticValueExtractor(Map.of(DIRECT_REF, 7), connector);

        Object value = extractor.extractValue(DIRECT_REF);

        assertThat(value).isEqualTo(7);
    }

    @Test
    void extractValueReturnsStaticValueWhenRequestDataReferenceIsOverridden() {
        StaticValueExtractor extractor = new StaticValueExtractor(Map.of(TOKEN_REF, "override"), connector);

        Object value = extractor.extractValue(TOKEN_REF);

        assertThat(value).isEqualTo("override");
    }

    @Test
    void extractValueReadsConnectorWhenRequestDataReferenceHasNoStaticValue() {
        StaticValueExtractor extractor = new StaticValueExtractor(Map.of(), connector);

        Object value = extractor.extractValue(TOKEN_REF);

        assertThat(value).isEqualTo("connector:" + TOKEN_REF);
    }

    @Test
    @DisplayName("extractValue — a null static value counts as given, not as missing")
    void extractValueReturnsNullWhenStaticValueIsNull() {
        Map<String, Object> values = new HashMap<>();
        values.put(DIRECT_REF, null);
        StaticValueExtractor extractor = new StaticValueExtractor(values, connector);

        Object value = extractor.extractValue(DIRECT_REF);

        assertThat(value).isNull();
    }

    @Test
    void extractValueReturnsNullWhenReferenceIsNull() {
        StaticValueExtractor extractor = new StaticValueExtractor(Map.of(), connector);

        Object value = extractor.extractValue(null);

        assertThat(value).isNull();
    }

    @Test
    void extractValueThrowsIllegalStateExceptionWhenDirectReferenceHasNoStaticValue() {
        StaticValueExtractor extractor = new StaticValueExtractor(Map.of(), connector);

        assertThatThrownBy(() -> extractor.extractValue(DIRECT_REF))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(DIRECT_REF);
    }

    @Test
    @DisplayName("extractValue — keeps its own copy of the static values")
    void extractValueIgnoresCallerMapWhenMapChangesAfterCreation() {
        Map<String, Object> values = new HashMap<>(Map.of(DIRECT_REF, 7));
        StaticValueExtractor extractor = new StaticValueExtractor(values, connector);
        values.put(DIRECT_REF, 8);

        Object value = extractor.extractValue(DIRECT_REF);

        assertThat(value).isEqualTo(7);
    }
}
