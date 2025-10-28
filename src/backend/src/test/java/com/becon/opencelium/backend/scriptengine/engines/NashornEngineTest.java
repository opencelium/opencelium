package com.becon.opencelium.backend.scriptengine.engines;

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

public class NashornEngineTest {

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
    void setup() {
        engine = new NashornEngine();
    }

    @Test
    void testExecuteWithoutBindingsReturnsPrimitive() throws Exception {
        String script = "1 + 2";
        Object result = engine.execute(script);
        assertThat(result).isEqualTo(3);
    }

    @Test
    void testExecuteWithPrimitiveBinding() throws Exception {
        String script = "a + 5";
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("a", 10);

        Object result = engine.execute(script, bindings);
        assertThat(result).isEqualTo(15.0);
    }

    @Test
    void testExecuteWithStringBinding() throws Exception {
        String script = "greeting + ', world!'";
        Map<String, Object> bindings = Map.of("greeting", "Hello");

        Object result = engine.execute(script, bindings);
        assertThat(result).isEqualTo("Hello, world!");
    }

    @Test
    void testExecuteWithJsonObjectBinding() throws Exception {
        String script = "user.name + ' is ' + user.age + ' years old'";
        Map<String, Object> bindings = Map.of("user", Map.of("name", "Alice", "age", 30));

        Object result = engine.execute(script, bindings);
        assertThat(result).isEqualTo("Alice is 30 years old");
    }

    @Test
    void testExecuteWithJsonArrayBinding() throws Exception {
        String script = "data[0] + data[1]";
        Map<String, Object> bindings = Map.of("data", List.of(3, 4));

        Object result = engine.execute(script, bindings);
        assertThat(result).isEqualTo(7.0);
    }

    @Test
    void testExecuteReturningObject() throws Exception {
        String script = "({ city: 'Tashkent', population: 2500000 })";
        Object result = engine.execute(script);

        assertThat(result).isInstanceOf(Map.class);
        Map<String, Object> map = (Map<String, Object>) result;

        assertThat(map).containsEntry("city", "Tashkent");
        assertThat(map).containsEntry("population", 2500000);
    }

    @Test
    void testExecuteReturningArray() throws Exception {
        String script = "[1, 2, 3]";
        Object result = engine.execute(script);

        assertThat(result).isInstanceOf(List.class);
        List<Integer> list = (List<Integer>) result;

        assertThat(list).containsExactly(1, 2, 3);
    }

    @Test
    void testExecuteInvalidScriptThrowsException() {
        String script = "var = ;"; // Syntax error

        assertThatThrownBy(() -> engine.validate(script))
                .isInstanceOf(InvalidScriptException.class);
    }

    @Test
    void testExecuteWithNullBinding() throws Exception {
        String script = "'Hello ' + name";
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("name", null);

        Object result = engine.execute(script, bindings);
        assertThat(result).isEqualTo("Hello null");
    }

    @Test
    void execute_withNullBindings_returnsPrimitive() {
        Object result = engine.execute("1 + 2", null);
        assertEquals(3, ((Number) result).intValue());
    }

    @Test
    void execute_withPrimitiveBinding_returnsSum() {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("x", 10);
        Object result = engine.execute("x + 5", bindings);
        assertEquals(15, ((Number) result).intValue());
    }

    @Test
    void execute_withListBinding_returnsArrayLength() {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("items", List.of(1, 2, 3));
        Object result = engine.execute("items.length", bindings);
        assertEquals(3, ((Number) result).intValue());
    }

    @Test
    void execute_withMapBinding_returnsMappedValue() {
        Map<String, Object> bindings = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        data.put("value", 42);
        bindings.put("myMap", data);
        Object result = engine.execute("myMap.value", bindings);
        assertEquals(42, ((Number) result).intValue());
    }

    @Test
    void execute_returnsArrayResult() {
        Object result = engine.execute("[1, 2, 3]", null);
        assertInstanceOf(List.class, result);
        assertEquals(List.of(1, 2, 3), result);
    }

    @Test
    void execute_returnsMapResult() {
        Object result = engine.execute("({ foo: 'bar', baz: 42 })", null);
        assertInstanceOf(Map.class, result);
        Map<?, ?> map = (Map<?, ?>) result;
        assertEquals("bar", map.get("foo"));
        assertEquals(42, ((Number) map.get("baz")).intValue());
    }

    @Test
    void execute_returnsNull() {
        Object result = engine.execute("null", null);
        assertNull(result);
    }

    @Test
    void execute_withSyntaxError_throwsException() {
        assertThrows(ScriptExecutionException.class, () -> engine.execute("function() {", null));
    }

    @Test
    void validate_withValidScript_doesNotThrow() {
        assertDoesNotThrow(() -> engine.validate("var x = 10;"));
    }

    @Test
    void validate_withInvalidSyntax_throwsInvalidScriptException() {
        assertThrows(InvalidScriptException.class, () -> engine.validate("function() {"));
    }

    @Test
    void validate_withNashornNotCompilable_doesNotThrow() {
        // This case should succeed without exception as fallback
        assertDoesNotThrow(() -> engine.validate("1 + 1"));
    }

    @Test
    void testWithReference() {
        assertEquals(engine.execute("a + 'a'", Map.of("a", "{%#ffffff.(request).url%}"), referenceExtractor), referenceValues.get("{%#ffffff.(request).url%}") + "a");
    }

}
