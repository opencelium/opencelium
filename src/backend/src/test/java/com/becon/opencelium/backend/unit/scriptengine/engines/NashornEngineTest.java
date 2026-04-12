package com.becon.opencelium.backend.unit.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import org.assertj.core.api.InstanceOfAssertFactories;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link NashornEngine}.
 *
 * No Spring context is loaded. The engine is instantiated directly.
 * Run with: ./gradlew test
 */
@DisplayName("NashornEngine — unit")
class NashornEngineTest {

    private NashornEngine engine;

    @BeforeEach
    void setUp() {
        engine = new NashornEngine();
    }

    // ── execute — no bindings ─────────────────────────────────────────────────

    @Test
    void executeReturnsEvaluatedExpressionWithoutBindings() {
        assertThat(engine.execute("1 + 2")).isEqualTo(3);
    }

    @Test
    void executeReturnsPrimitiveWhenBindingsAreNull() {
        assertThat(((Number) engine.execute("1 + 2", null)).intValue()).isEqualTo(3);
    }

    @Test
    void executeReturnsNullWhenScriptResultIsNull() {
        assertThat(engine.execute("null", null)).isNull();
    }

    // ── execute — primitive bindings ──────────────────────────────────────────

    @Test
    void executeReturnsResultWithPrimitiveBinding() {
        assertThat(engine.execute("a + 5", Map.of("a", 10))).isEqualTo(15.0);
    }

    @Test
    void executeReturnsConcatenatedStringWithStringBinding() {
        assertThat(engine.execute("greeting + ', world!'", Map.of("greeting", "Hello")))
                .isEqualTo("Hello, world!");
    }

    @Test
    void executeReturnsStringWithNullBinding() {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("name", null);

        assertThat(engine.execute("'Hello ' + name", bindings)).isEqualTo("Hello null");
    }

    // ── execute — collection and object bindings ──────────────────────────────

    @Test
    void executeReturnsStringFromObjectPropertiesWithMapBinding() {
        assertThat(engine.execute(
                "user.name + ' is ' + user.age + ' years old'",
                Map.of("user", Map.of("name", "Alice", "age", 30))
        )).isEqualTo("Alice is 30 years old");
    }

    @Test
    void executeReturnsSumOfListElementsWithListBinding() {
        assertThat(engine.execute("data[0] + data[1]", Map.of("data", List.of(3, 4)))).isEqualTo(7.0);
    }

    @Test
    void executeReturnsArrayLengthWithListBinding() {
        assertThat(((Number) engine.execute("items.length", Map.of("items", List.of(1, 2, 3)))).intValue())
                .isEqualTo(3);
    }

    @Test
    void executeReturnsMappedValueWithMapBinding() {
        assertThat(((Number) engine.execute("myMap.value", Map.of("myMap", Map.of("value", 42)))).intValue())
                .isEqualTo(42);
    }

    // ── execute — script evaluates to collection or object ───────────────────

    @Test
    void executeReturnsListWhenScriptEvaluatesToArray() {
        assertThat(engine.execute("[1, 2, 3]"))
                .asInstanceOf(InstanceOfAssertFactories.LIST)
                .containsExactly(1, 2, 3);
    }

    @Test
    void executeReturnsMapWhenScriptEvaluatesToObject() {
        assertThat(engine.execute("({ city: 'Tashkent', population: 2500000 })"))
                .asInstanceOf(InstanceOfAssertFactories.map(String.class, Object.class))
                .containsEntry("city", "Tashkent")
                .containsEntry("population", 2500000);
    }

    // ── execute — reference extractor ─────────────────────────────────────────

    @Test
    void executeReplacesReferenceValuesUsingExtractor() {
        String ref = "{%#ffffff.(request).url%}";
        String url = "https://www.google.com";
        Map<String, Object> referenceValues = Map.of(ref, url);

        assertThat(engine.execute("a + 'a'", Map.of("a", ref), referenceValues::get))
                .isEqualTo(url + "a");
    }

    // ── execute — errors ──────────────────────────────────────────────────────

    @Test
    void executeThrowsScriptExecutionExceptionForSyntaxError() {
        assertThatThrownBy(() -> engine.execute("function() {", null))
                .isInstanceOf(ScriptExecutionException.class);
    }

    // ── validate ──────────────────────────────────────────────────────────────

    @Test
    void validateDoesNotThrowForValidScript() {
        assertThatCode(() -> engine.validate("var x = 10;")).doesNotThrowAnyException();
    }

    @Test
    void validateThrowsInvalidScriptExceptionForSyntaxError() {
        assertThatThrownBy(() -> engine.validate("function() {"))
                .isInstanceOf(InvalidScriptException.class);
    }
}
