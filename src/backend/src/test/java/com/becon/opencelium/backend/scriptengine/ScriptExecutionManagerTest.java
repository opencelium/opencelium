package com.becon.opencelium.backend.polygot_engine;

import com.becon.opencelium.backend.polygot_engine.engines.GraalJSEngine;
import com.becon.opencelium.backend.polygot_engine.engines.GraalPythonEngine;
import com.becon.opencelium.backend.polygot_engine.engines.GraalRubyEngine;
import com.becon.opencelium.backend.polygot_engine.engines.JythonEngine;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

@SpringBootTest
public class ScriptExecutionManagerTest {

    @Nested
    @SpringBootTest(properties = {
            "opencelium.languages[0].lang=python_2",
            "opencelium.languages[0].engine=jython",
            "opencelium.languages[1].lang=python_3",
            "opencelium.languages[1].engine=graalvm",
            "opencelium.languages[2].lang=js",
            "opencelium.languages[2].engine=graalvm",
            "opencelium.languages[3].lang=ruby",
            "opencelium.languages[3].engine=graalvm",
    })
    class JythonEngineTest {

        @Autowired
        ScriptExecutionManager scriptExecutionManager;

        @Test
        void testJythonEngine() {
            Optional<ScriptEngine> scriptEngineOptional = scriptExecutionManager.resolveEngine(LanguageType.PYTHON_2);

            Assertions.assertTrue(scriptEngineOptional.isPresent());

            ScriptEngine scriptEngine = scriptEngineOptional.get();

            Assertions.assertEquals(JythonEngine.class, scriptEngine.getClass());
        }

        @Test
        void testGraalJSEngine() {
            Optional<ScriptEngine> scriptEngineOptional = scriptExecutionManager.resolveEngine(LanguageType.JS);

            Assertions.assertTrue(scriptEngineOptional.isPresent());

            ScriptEngine scriptEngine = scriptEngineOptional.get();

            Assertions.assertEquals(GraalJSEngine.class, scriptEngine.getClass());
        }

        @Test
        void testGraalPythonEngine() {
            Optional<ScriptEngine> scriptEngineOptional = scriptExecutionManager.resolveEngine(LanguageType.PYTHON_3);

            Assertions.assertTrue(scriptEngineOptional.isPresent());

            ScriptEngine scriptEngine = scriptEngineOptional.get();

            Assertions.assertEquals(GraalPythonEngine.class, scriptEngine.getClass());
        }

        @Test
        void testGraalRubyEngine() {
            Optional<ScriptEngine> scriptEngineOptional = scriptExecutionManager.resolveEngine(LanguageType.RUBY);

            Assertions.assertTrue(scriptEngineOptional.isPresent());

            ScriptEngine scriptEngine = scriptEngineOptional.get();

            Assertions.assertEquals(GraalRubyEngine.class, scriptEngine.getClass());
        }
    }
}
