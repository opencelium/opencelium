package com.becon.opencelium.backend.unit.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.*;

class NashornEngineTest {

    private NashornEngine engine;
    private static final HashMap<String, Object> referenceValues = new HashMap<>();
    private static final Function<String, Object> referenceExtractor = referenceValues::get;

    static {
        referenceValues.put("{%#ffffff.(request).url%}", "https://www.google.com");
        referenceValues.put("{%#ffffff.(request).array_of_objects%}", List.of(new HashMap<String, Object>() {{
            put("id", 1);
            put("name", "Bob");
        }}));
    }

    @BeforeEach
    void setUp() {
        engine = new NashornEngine();
    }

    @Test
    void executeReturnsEvaluatedExpressionWithoutBindings() throws Exception {
        Object result = engine.execute("1 + 2");
        assertThat(result).isEqualTo(3);
    }

    @Test
    void executeReturnsResultWithPrimitiveBinding() throws Exception {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("a", 10);

        Object result = engine.execute("a + 5", bindings);
        assertThat(result).isEqualTo(15.0);
    }

    @Test
    void executeReturnsConcatenatedStringWithStringBinding() throws Exception {
        Map<String, Object> bindings = Map.of("greeting", "Hello");

        Object result = engine.execute("greeting + ', world!'", bindings);
        assertThat(result).isEqualTo("Hello, world!");
    }

    @Test
    void executeAccessesObjectPropertiesWithMapBinding() throws Exception {
        Map<String, Object> bindings = Map.of("user", Map.of("name", "Alice", "age", 30));

        Object result = engine.execute("user.name + ' is ' + user.age + ' years old'", bindings);
        assertThat(result).isEqualTo("Alice is 30 years old");
    }

    @Test
    void executeAccessesArrayElementsWithListBinding() throws Exception {
        Map<String, Object> bindings = Map.of("data", List.of(3, 4));

        Object result = engine.execute("data[0] + data[1]", bindings);
        assertThat(result).isEqualTo(7.0);
    }

    @Test
    void executeReturnsMapWhenScriptEvaluatesToObject() throws Exception {
        Object result = engine.execute("({ city: 'Tashkent', population: 2500000 })");

        assertThat(result).isInstanceOf(Map.class);
        Map<String, Object> map = (Map<String, Object>) result;

        assertThat(map).containsEntry("city", "Tashkent");
        assertThat(map).containsEntry("population", 2500000);
    }

    @Test
    void executeReturnsListWhenScriptEvaluatesToArray() throws Exception {
        Object result = engine.execute("[1, 2, 3]");

        assertThat(result).isInstanceOf(List.class);
        List<Integer> list = (List<Integer>) result;

        assertThat(list).containsExactly(1, 2, 3);
    }

    @Test
    void validateThrowsInvalidScriptExceptionForSyntaxError() {
        assertThatThrownBy(() -> engine.validate("var = ;"))
                .isInstanceOf(InvalidScriptException.class);
    }

    @Test
    void executeReturnsStringWithNullBinding() throws Exception {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("name", null);

        Object result = engine.execute("'Hello ' + name", bindings);
        assertThat(result).isEqualTo("Hello null");
    }

    @Test
    void executeReturnsPrimitiveWithNullBindings() {
        Object result = engine.execute("1 + 2", null);
        assertEquals(3, ((Number) result).intValue());
    }

    @Test
    void executeReturnsSumWithPrimitiveBinding() {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("x", 10);
        Object result = engine.execute("x + 5", bindings);
        assertEquals(15, ((Number) result).intValue());
    }

    @Test
    void executeReturnsArrayLengthWithListBinding() {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("items", List.of(1, 2, 3));
        Object result = engine.execute("items.length", bindings);
        assertEquals(3, ((Number) result).intValue());
    }

    @Test
    void executeReturnsMappedValueWithMapBinding() {
        Map<String, Object> bindings = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        data.put("value", 42);
        bindings.put("myMap", data);
        Object result = engine.execute("myMap.value", bindings);
        assertEquals(42, ((Number) result).intValue());
    }

    @Test
    void executeReturnsListResultWhenScriptEvaluatesToArray() {
        Object result = engine.execute("[1, 2, 3]", null);
        assertInstanceOf(List.class, result);
        assertEquals(List.of(1, 2, 3), result);
    }

    @Test
    void executeReturnsMapResultWhenScriptEvaluatesToObject() {
        Object result = engine.execute("({ foo: 'bar', baz: 42 })", null);
        assertInstanceOf(Map.class, result);
        Map<?, ?> map = (Map<?, ?>) result;
        assertEquals("bar", map.get("foo"));
        assertEquals(42, ((Number) map.get("baz")).intValue());
    }

    @Test
    void executeReturnsNullWhenScriptResultIsNull() {
        Object result = engine.execute("null", null);
        assertNull(result);
    }

    @Test
    void executeThrowsScriptExecutionExceptionForSyntaxError() {
        assertThrows(ScriptExecutionException.class, () -> engine.execute("function() {", null));
    }

    @Test
    void validateDoesNotThrowForValidScript() {
        assertDoesNotThrow(() -> engine.validate("var x = 10;"));
    }

    @Test
    void validateThrowsInvalidScriptExceptionForInvalidSyntax() {
        assertThrows(InvalidScriptException.class, () -> engine.validate("function() {"));
    }

    @Test
    void validateDoesNotThrowWhenNashornCannotCompile() {
        assertDoesNotThrow(() -> engine.validate("1 + 1"));
    }

    @Test
    void executeReplacesReferenceValuesUsingExtractor() {
        assertEquals(engine.execute("a + 'a'", Map.of("a", "{%#ffffff.(request).url%}"), referenceExtractor), referenceValues.get("{%#ffffff.(request).url%}") + "a");
    }
}
