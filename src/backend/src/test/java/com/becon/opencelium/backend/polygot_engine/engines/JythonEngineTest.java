package com.becon.opencelium.backend.polygot_engine.engines;

import com.becon.opencelium.backend.polygot_engine.ex.InvalidScriptException;
import com.becon.opencelium.backend.polygot_engine.ex.ScriptExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

class JythonEngineTest {

    private JythonEngine engine;

    @BeforeEach
    void setUp() {
        engine = new JythonEngine();
    }

    @Test
    void execute_shouldReturnPrimitiveResult() throws Exception {
        Object result = engine.execute("result = 2 + 3");
        assertThat(result).isEqualTo(5);
    }

    @Test
    void execute_shouldUseBindingsAndReturnProcessedMap() throws Exception {
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("x", 10);
        bindings.put("y", 5);

        Object result = engine.execute("result = {'sum': x + y, 'diff': x - y}", bindings);

        assertThat(result)
            .isInstanceOf(Map.class)
            .extracting("sum", "diff")
            .containsExactly(15, 5);
    }

    @Test
    void execute_withRefExtractor_shouldWork() throws Exception {
        Map<String, String> bindings = Map.of("x", "100", "y", "50");

        Object result = engine.execute(
                "result = int(x) * int(y)",
                bindings,
                Integer::parseInt
        );

        assertThat(result).isEqualTo(5000);
    }

    @Test
    void validate_shouldNotThrowForValidScript() {
        assertThatCode(() -> engine.validate("x = 1 + 2")).doesNotThrowAnyException();
    }

    @Test
    void validate_shouldThrowForInvalidScript() {
        assertThatThrownBy(() -> engine.validate("def x:"))
            .isInstanceOf(InvalidScriptException.class);
    }

    @Test
    void execute_shouldThrowForRuntimeError() {
        assertThatThrownBy(() -> engine.execute("raise Exception('fail')"))
            .isInstanceOf(ScriptExecutionException.class)
            .hasMessageContaining("Jython execution error");
    }

    @Test
    void execute_shouldReturnNullIfNoResultVariable() throws Exception {
        Object result = engine.execute("x = 42"); // no `result = ...`
        assertThat(result).isNull();
    }

    @Test
    void testMapBindingAndAccess() throws ScriptExecutionException {
        // Prepare bindings: simulate a nested map structure
        Map<String, Object> nestedMap = new HashMap<>();
        nestedMap.put("x", 5);
        nestedMap.put("y", 10);

        Map<String, Object> bindings = new HashMap<>();
        bindings.put("input", nestedMap);

        // Python script that uses the bound map and calculates a sum
        String script = "" +
                "result = input['x'] + input['y']";

        Object result = engine.execute(script, bindings);

        // Assert the result is the expected sum
        assertEquals(15, result);
    }
}
