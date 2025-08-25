package com.becon.opencelium.backend.polygot_engine.config;

import com.becon.opencelium.backend.polygot_engine.Language;
import com.becon.opencelium.backend.polygot_engine.LanguageType;
import com.becon.opencelium.backend.polygot_engine.ScriptEngineType;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

/**
 * Integration-style tests that validate dynamic loading of language configurations
 * from Spring Boot properties into {@link LanguageConfig}.
 *
 * Each nested test class loads a different Spring context with its own set of properties.
 */
@SpringBootTest
@EnableConfigurationProperties(ScriptLangProperties.class)
class LanguageConfigTest {

    /**
     * Test scenario: A single Python 2 language is configured with Jython engine enabled.
     */
    @Nested
    @SpringBootTest(properties = {
            "opencelium.languages[0].lang=python_2",
            "opencelium.languages[0].engine=jython",
            "opencelium.languages[0].enabled=true"
    })
    class JythonEngineTest {

        @Autowired
        @Qualifier("scriptLangProperties")
        ScriptLangProperties props;

        LanguageConfig languageConfig;

        @BeforeEach
        void setUp() {
            languageConfig = new LanguageConfig(props);
        }

        @Test
        void shouldLoadPython2WithJython() {
            List<Language> languages = languageConfig.enabledLanguages();

            // Expect exactly one enabled language: Python 2 using Jython
            Assertions.assertEquals(1, languages.size());
            Assertions.assertEquals(
                    new Language(LanguageType.PYTHON_2, ScriptEngineType.JYTHON),
                    languages.get(0)
            );
        }
    }

    /**
     * Test scenario: First Python 2 entry is disabled, second one is enabled with Jython.
     * Expect no enabled languages due to filtering logic.
     */
    @Nested
    @SpringBootTest(properties = {
            "opencelium.languages[0].lang=python_2",
            "opencelium.languages[0].enabled=false",
            "opencelium.languages[1].lang=python_2",
            "opencelium.languages[1].engine=jython",
            "opencelium.languages[1].enabled=true"
    })
    class JythonEngineTest2 {

        @Autowired
        @Qualifier("scriptLangProperties")
        ScriptLangProperties props;

        LanguageConfig languageConfig;

        @BeforeEach
        void setUp() {
            languageConfig = new LanguageConfig(props);
        }

        @Test
        void shouldNotLoadDisabledPython2() {
            List<Language> languages = languageConfig.enabledLanguages();

            Assertions.assertTrue(
                    languages.isEmpty()
            );
        }
    }

    /**
     * Test scenario: Multiple languages configured without explicit engine.
     * Each language should fall back to its default engine.
     */
    @Nested
    @SpringBootTest(properties = {
            "opencelium.languages[0].lang=python_2",
            "opencelium.languages[1].lang=python_3",
            "opencelium.languages[2].lang=js",
            "opencelium.languages[3].lang=ruby"
    })
    class DefaultEngineTest {

        @Autowired
        @Qualifier("scriptLangProperties")
        ScriptLangProperties props;

        LanguageConfig languageConfig;

        @BeforeEach
        void setUp() {
            languageConfig = new LanguageConfig(props);
        }

        @Test
        void shouldLoadLanguagesWithDefaultEngines() {
            List<Language> languages = languageConfig.enabledLanguages();

            // Expect all 4 languages to be enabled
            Assertions.assertEquals(4, languages.size());

            // Each language should resolve to its default engine
            languages.forEach(l ->
                    Assertions.assertEquals(new Language(l.getLanguage(), l.getLanguage().getDefaultEngine()), l)
            );
        }
    }

    /**
     * Test scenario: Multiple languages explicitly configured with GraalVM.
     */
    @Nested
    @SpringBootTest(properties = {
            "opencelium.languages[0].lang=ruby",
            "opencelium.languages[0].engine=graalvm",
            "opencelium.languages[1].lang=python_3",
            "opencelium.languages[1].engine=graalvm",
            "opencelium.languages[2].lang=js",
            "opencelium.languages[2].engine=graalvm"
    })
    class GraalVmEngineTest {

        @Autowired
        @Qualifier("scriptLangProperties")
        ScriptLangProperties props;

        LanguageConfig languageConfig;

        @BeforeEach
        void setUp() {
            languageConfig = new LanguageConfig(props);
        }

        @Test
        void shouldLoadAllWithGraalVm() {
            List<Language> languages = languageConfig.enabledLanguages();

            // Expect 3 enabled languages all using GraalVM
            Assertions.assertEquals(3, languages.size());

            languages.forEach(l ->
                    Assertions.assertEquals(new Language(l.getLanguage(), ScriptEngineType.GRAALVM), l)
            );
        }
    }
}
