package com.becon.opencelium.backend.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.Language;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngineType;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GraalPythonEngineTest {

    private GraalPythonEngine engine;

    @BeforeEach
    void setup() {
        engine = new GraalPythonEngine();
    }

    @Test
    void testSupports_positive() {
        Language lang = new Language(LanguageType.PYTHON_3, ScriptEngineType.GRAALVM);
        assertTrue(engine.supports(lang));
    }

    @Test
    void testSupports_nullLanguage() {
        assertFalse(engine.supports(null));
    }

    @Test
    void testSupports_wrongLanguageType() {
        Language lang = new Language(LanguageType.JS, ScriptEngineType.GRAALVM);
        assertFalse(engine.supports(lang));
    }

    @Test
    void testSupports_wrongEngineType() {
        Language lang = new Language(LanguageType.PYTHON_3, ScriptEngineType.NASHORN);
        assertFalse(engine.supports(lang));
    }

    @Test
    void testExecute_simpleScript_returnsValue() throws Exception {
        Object result = engine.execute("1 + 1");
        assertEquals(2, ((Number) result).intValue());
    }

    @Test
    void testExecute_withBindings() {
        String script = "x + y";
        Map<String, Object> bindings = new HashMap<>();
        bindings.put("x", 10);
        bindings.put("y", 20);
        Object result = engine.execute(script, bindings);
        assertEquals(30, ((Number) result).intValue());
    }

    @Test
    void testExecute_withBindingsAndReferenceExtractor() throws Exception {
        String script = "value * 2";
        Map<String, String> bindings = Map.of("value", "ref1");
        // Mock reference extractor to resolve "ref1" -> 5
        var referenceExtractor = mock(java.util.function.Function.class);
        when(referenceExtractor.apply("ref1")).thenReturn(5);

        Object result = engine.execute(script, bindings, referenceExtractor);
        assertEquals(10, ((Number) result).intValue());
        verify(referenceExtractor).apply("ref1");
    }

    @Test
    void testExecute_syntaxError_throwsInvalidScriptException() {
        String invalidScript = "if True print('hello')"; // missing colon

        InvalidScriptException ex = assertThrows(InvalidScriptException.class, () -> {
            engine.execute(invalidScript);
        });
        assertTrue(ex.getMessage().toLowerCase().contains("syntax"));
    }

    @Test
    void testExecute_runtimeError_throwsScriptExecutionException() {
        String script = "1 / 0"; // division by zero

        ScriptExecutionException ex = assertThrows(ScriptExecutionException.class, () -> {
            engine.execute(script);
        });
        assertTrue(ex.getMessage().toLowerCase().contains("division"));
    }

    @Test
    void testValidate_validScript() throws Exception {
        engine.validate("x = 1 + 1");
        // no exception expected
    }

    @Test
    void testValidate_invalidScript_throwsInvalidScriptException() {
        String invalidScript = "def foo print('missing paren')";

        InvalidScriptException ex = assertThrows(InvalidScriptException.class, () -> {
            engine.validate(invalidScript);
        });
        assertTrue(ex.getMessage().toLowerCase().contains("syntax"));
    }

    @Test
    void testIsUp() {
        assertTrue(engine.isUp());
    }
}
