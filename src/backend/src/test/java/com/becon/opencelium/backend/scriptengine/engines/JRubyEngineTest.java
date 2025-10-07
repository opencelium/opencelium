package com.becon.opencelium.backend.scriptengine.engines;

import com.becon.opencelium.backend.scriptengine.Language;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngineType;
import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JRubyEngineTest {

    private final JRubyEngine engine = new JRubyEngine();

    @Test
    void supportsRubyLanguage() {
        Language lang = new Language(LanguageType.RUBY, ScriptEngineType.JRUBY);
        assertTrue(engine.supports(lang));
    }

    @Test
    void executeSimpleScript() throws Exception {
        Object result = engine.execute("RESULT_VAR = 1 + 2");
        assertEquals(3L, result);
    }

    @Test
    void executeWithBindings() throws Exception {
        Map<String, Object> bindings = Map.of("x", 5, "y", 7);
        Object result = engine.execute("RESULT_VAR = x * y", bindings);
        assertEquals(35L, result);
    }

    @Test
    void executeReturnsList() throws Exception {
        Object result = engine.execute("RESULT_VAR = [1, 2, 3]");
        assertTrue(result instanceof List);
        assertEquals(List.of(1, 2, 3), result);
    }

    @Test
    void executeReturnsMap() throws Exception {
        Object result = engine.execute("RESULT_VAR = { 'a' => 1, 'b' => 2 }");
        assertTrue(result instanceof Map);
        assertEquals(1, ((Map<?, ?>) result).get("a"));
        assertEquals(2, ((Map<?, ?>) result).get("b"));
    }

    @Test
    void executeWithReferenceExtractor() throws Exception {
        Map<String, String> bindings = Map.of("val", "lookup-key");
        Object result = engine.execute("RESULT_VAR = val + 10", bindings, ref -> {
            if (ref.equals("lookup-key")) return 32;
            return 0;
        });
        assertEquals(42L, result);
    }

    @Test
    void validateGoodScript() {
        assertDoesNotThrow(() -> engine.validate("x = 1 + 2"));
    }

    @Test
    void validateBadScript() {
        assertThrows(InvalidScriptException.class, () -> engine.validate("def broken("));
    }

    @Test
    void isUpAlwaysTrue() {
        assertTrue(engine.isUp());
    }

    @Test
    void nullResultReturnsNull() throws Exception {
        Object result = engine.execute("RESULT_VAR = nil");
        assertNull(result);
    }
}
