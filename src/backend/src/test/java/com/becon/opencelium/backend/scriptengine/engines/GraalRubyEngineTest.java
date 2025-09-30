//package com.becon.opencelium.backend.scriptengine.engines;
//
//import com.becon.opencelium.backend.scriptengine.Language;
//import com.becon.opencelium.backend.scriptengine.LanguageType;
//import com.becon.opencelium.backend.scriptengine.ScriptEngineType;
//import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
//import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//
//import java.util.HashMap;
//import java.util.Map;
//
//import static org.assertj.core.api.Assertions.*;
//import static org.junit.jupiter.api.Assertions.assertEquals;
//
//class GraalRubyEngineTest {
//
//    private GraalRubyEngine engine;
//
//    @BeforeEach
//    void setUp() {
//        engine = new GraalRubyEngine();
//    }
//
//    @Test
//    void supports_shouldReturnTrueForRubyGraalvm() {
//        assertThat(engine.supports(new Language(LanguageType.RUBY, ScriptEngineType.GRAALVM))).isTrue();
//    }
//
//    @Test
//    void supports_shouldReturnFalseForOtherLanguages() {
//        assertThat(engine.supports(new Language(LanguageType.PYTHON_3, ScriptEngineType.GRAALVM))).isFalse();
//        assertThat(engine.supports(null)).isFalse();
//    }
//
//    @Test
//    void execute_shouldReturnPrimitiveResult() throws Exception {
//        Object result = engine.execute("1 + 2");
//        assertThat(result).isEqualTo(3);
//    }
//
//    @Test
//    void execute_shouldReturnBooleanResult() throws Exception {
//        Object result = engine.execute("5 > 3");
//        assertThat(result).isEqualTo(true);
//    }
//
//    @Test
//    void execute_shouldUseBindingsAndReturnProcessedMap() throws Exception {
//        Map<String, Object> bindings = new HashMap<>();
//        bindings.put("x", 10);
//        bindings.put("y", 5);
//
//        String script = "result = {'sum' => x + y, 'diff' => x - y}\nresult";
//
//        Object result = engine.execute(script, bindings);
//
//        assertThat(result)
//            .isInstanceOf(Map.class)
//            .extracting("sum").isEqualTo(15);
//        assertThat(result)
//            .isInstanceOf(Map.class)
//            .extracting("diff").isEqualTo(5);
//    }
//
//    @Test
//    void execute_withRefExtractor_shouldWork() throws Exception {
//        Map<String, String> bindings = Map.of("x", "100", "y", "50");
//
//        String script = "result = x.to_i * y.to_i\nresult";
//
//        Object result = engine.execute(script, bindings, Integer::parseInt);
//
//        assertThat(result).isEqualTo(5000);
//    }
//
//    @Test
//    void validate_shouldNotThrowForValidScript() {
//        assertThatCode(() -> engine.validate("x = 1 + 2")).doesNotThrowAnyException();
//    }
//
//    @Test
//    void validate_shouldThrowForInvalidScript() {
//        assertThatThrownBy(() -> engine.validate("def x:"))
//            .isInstanceOf(InvalidScriptException.class);
//    }
//
//    @Test
//    void execute_shouldThrowForRuntimeError() {
//        assertThatThrownBy(() -> engine.execute("raise 'fail'"))
//            .isInstanceOf(ScriptExecutionException.class)
//            .hasMessageContaining("fail");
//    }
//
//    @Test
//    void execute_shouldReturnNullIfScriptReturnsNil() throws Exception {
//        Object result = engine.execute("nil");
//        assertThat(result).isNull();
//    }
//
//    @Test
//    void testMapBindingAndAccess() throws ScriptExecutionException, InvalidScriptException {
//        Map<String, Object> nestedMap = new HashMap<>();
//        nestedMap.put("a", 5);
//        nestedMap.put("b", 10);
//
//        Map<String, Object> bindings = new HashMap<>();
//        bindings.put("input", nestedMap);
//
//        String script = "result = input['a'] + input['b']\nresult";
//
//        Object result = engine.execute(script, bindings);
//
//        assertEquals(15, result);
//    }
//
//    @Test
//    void execute_shouldWorkWithEmptyBindings() {
//        String script = "42";
//
//        Object result = engine.execute(script, new HashMap<>());
//
//        assertThat(result).isEqualTo(42);
//    }
//}
