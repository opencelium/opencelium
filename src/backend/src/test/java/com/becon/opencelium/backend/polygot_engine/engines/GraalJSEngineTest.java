package com.becon.opencelium.backend.polygot_engine.engines;

import com.becon.opencelium.backend.polygot_engine.*;
import com.becon.opencelium.backend.polygot_engine.ex.InvalidScriptException;
import com.becon.opencelium.backend.polygot_engine.ex.ScriptExecutionException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class GraalJSEngineTest {

    private final ScriptEngine engine = new GraalJSEngine();

    @Test
    void executeShouldReturnPrimitiveNumber() {
        Object result = engine.execute("1 + 2");
        assertEquals(3, ((Number) result).intValue());
    }

    @Test
    void executeShouldReturnString() {
        Object result = engine.execute("'hello ' + 'world'");
        assertEquals("hello world", result);
    }

    @Test
    void executeShouldReturnBoolean() {
        Object result = engine.execute("5 > 3");
        assertEquals(true, result);
    }

    @Test
    void executeShouldReturnNull() {
        Object result = engine.execute("null");
        assertNull(result);
    }

    @Test
    void executeShouldReturnArray() {
        Object result = engine.execute("[1, 2, 3]");
        assertTrue(result instanceof List);
        assertEquals(List.of(1, 2, 3), result);
    }

    @Test
    void isUp() {
        assertTrue(engine.isUp());
    }

    @Test
    void executeShouldReturnObject() {
        Object result = engine.execute("({a: 1, b: 'x'})");
        assertTrue(result instanceof Map);
        assertEquals(1, ((Map<?, ?>) result).get("a"));
        assertEquals("x", ((Map<?, ?>) result).get("b"));
    }

    @Test
    void executeWithPrimitiveBinding() {
        Map<String, Object> bindings = Map.of("x", 5);
        Object result = engine.execute("x * 2", bindings);
        assertEquals(10, ((Number) result).intValue());
    }

    @Test
    void executeWithComplexBinding() {
        Map<String, Object> bindings = Map.of("obj", Map.of("name", "Alice", "age", 30));
        Object result = engine.execute("obj.name + ' is ' + obj.age", bindings);
        assertEquals("Alice is 30", result);
    }

    @Test
    void executeWithReferenceExtractor() {
        Map<String, String> bindings = Map.of("value", "42");
        Object result = engine.execute("value + 1", bindings, Integer::valueOf);
        assertEquals(43, ((Number) result).intValue());
    }

    @Test
    void executeShouldThrowInvalidScriptExceptionForSyntaxError() {
        assertThrows(InvalidScriptException.class, () -> engine.execute("var x = "));
    }

    @Test
    void executeShouldThrowScriptExecutionExceptionForRuntimeError() {
        assertThrows(ScriptExecutionException.class, () -> engine.execute("nonExistentFunction()"));
    }

    @Test
    void validateShouldPassForValidScript() {
        assertDoesNotThrow(() -> engine.validate("let a = 5;"));
    }

    @Test
    void validateShouldFailForInvalidScript() {
        assertThrows(InvalidScriptException.class, () -> engine.validate("let = "));
    }
}

