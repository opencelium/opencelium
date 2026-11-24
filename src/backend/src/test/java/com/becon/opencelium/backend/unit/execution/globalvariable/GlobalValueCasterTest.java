package com.becon.opencelium.backend.unit.execution.globalvariable;

import static org.assertj.core.api.Assertions.assertThat;

import com.becon.opencelium.backend.execution.globalvariable.GlobalValueCaster;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Unit tests for {@link GlobalValueCaster}: the text a global value becomes where only text fits.
 *
 * <p>Run with: ./gradlew test --tests "*.GlobalValueCasterTest"
 */
@DisplayName("GlobalValueCaster — unit")
class GlobalValueCasterTest {

    @Test
    void toTextReturnsEmptyStringWhenValueIsNull() {
        assertThat(GlobalValueCaster.toText(null)).isEmpty();
    }

    @ParameterizedTest(name = "[{index}] {1}")
    @MethodSource("listsAndMaps")
    @DisplayName("toText — a list or a map is JSON without spaces, not Java's [a, b] or {k=v}")
    void toTextReturnsCompactJsonWhenValueIsListOrMap(Object value, String expected) {
        assertThat(GlobalValueCaster.toText(value)).isEqualTo(expected);
    }

    static Stream<Arguments> listsAndMaps() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("env", "prod");
        map.put("ids", List.of(1, 2));
        map.put("none", null);

        return Stream.of(
                Arguments.of(List.of("acme", 1, true), "[\"acme\",1,true]"),
                Arguments.of(List.of(), "[]"),
                Arguments.of(map, "{\"env\":\"prod\",\"ids\":[1,2],\"none\":null}"),
                Arguments.of(Map.of(), "{}"));
    }

    @ParameterizedTest(name = "[{index}] {1}")
    @MethodSource("scalars")
    @DisplayName("toText — a string is not quoted; a number or a boolean is its literal")
    void toTextReturnsLiteralWhenValueIsScalar(Object value, String expected) {
        assertThat(GlobalValueCaster.toText(value)).isEqualTo(expected);
    }

    static Stream<Arguments> scalars() {
        return Stream.of(
                Arguments.of("https://cmdb.example.test", "https://cmdb.example.test"),
                Arguments.of("", ""),
                Arguments.of(42, "42"),
                Arguments.of(1.5, "1.5"),
                Arguments.of(true, "true"));
    }
}
