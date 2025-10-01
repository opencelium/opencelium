//package com.becon.opencelium.backend.scriptengine;
//
//import com.becon.opencelium.backend.scriptengine.engines.GraalJSEngine;
//import com.becon.opencelium.backend.scriptengine.engines.GraalPythonEngine;
//import com.becon.opencelium.backend.scriptengine.engines.GraalRubyEngine;
//import org.junit.jupiter.api.Assertions;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.context.SpringBootTest;
//
//import java.util.Optional;
//
//@SpringBootTest
//public class ScriptExecutionManagerTest {
//
//    @Autowired
//    ScriptExecutionManager scriptExecutionManager;
//
//    @Test
//    void testGraalJSEngine() {
//        Optional<ScriptEngine> scriptEngineOptional = scriptExecutionManager.resolveEngine(LanguageType.JS);
//
//        Assertions.assertTrue(scriptEngineOptional.isPresent());
//
//        ScriptEngine scriptEngine = scriptEngineOptional.get();
//
//        Assertions.assertEquals(GraalJSEngine.class, scriptEngine.getClass());
//    }
//
//    @Test
//    void testGraalPythonEngine() {
//        Optional<ScriptEngine> scriptEngineOptional = scriptExecutionManager.resolveEngine(LanguageType.PYTHON_3);
//
//        Assertions.assertTrue(scriptEngineOptional.isPresent());
//
//        ScriptEngine scriptEngine = scriptEngineOptional.get();
//
//        Assertions.assertEquals(GraalPythonEngine.class, scriptEngine.getClass());
//    }
//
//    @Test
//    void testGraalRubyEngine() {
//        Optional<ScriptEngine> scriptEngineOptional = scriptExecutionManager.resolveEngine(LanguageType.RUBY);
//
//        Assertions.assertTrue(scriptEngineOptional.isPresent());
//
//        ScriptEngine scriptEngine = scriptEngineOptional.get();
//
//        Assertions.assertEquals(GraalRubyEngine.class, scriptEngine.getClass());
//    }
//}