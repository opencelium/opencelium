package com.becon.opencelium.backend.polygot_engine.config;

import com.becon.opencelium.backend.polygot_engine.Language;
import com.becon.opencelium.backend.polygot_engine.LanguageType;
import com.becon.opencelium.backend.polygot_engine.ScriptEngineType;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Initializes the supported languages and their corresponding script engines
 * based on the user-defined configuration provided via ScriptLangProperties.
 *
 * <p>Only languages explicitly enabled will be included. A language may rely
 * on a default engine if not provided, and a language is fully disabled if any
 * entry explicitly sets "enabled: false".</p>
 */
@Component
public class LanguageConfig {

    private final ScriptLangProperties scriptLangProperties;
    private final List<Language> enabledLanguages;

    /**
     * Constructs the LanguageConfig with injected ScriptLangProperties.
     * Parses configuration and determines all enabled languages.
     *
     * @param scriptLangProperties injected language configuration
     */
    public LanguageConfig(ScriptLangProperties scriptLangProperties) {
        this.scriptLangProperties = scriptLangProperties;
        this.enabledLanguages = initLanguages();
    }

    /**
     * Initializes enabled languages based on configuration.
     * Groups entries by language type and applies enable/disable policy.
     *
     * @return a list of enabled {@link Language} objects
     */
    private List<Language> initLanguages() {
        List<ScriptLangProperties.LanguageProperties> languages = scriptLangProperties.getLanguages();

        if (languages == null || languages.isEmpty()) {
            return Collections.emptyList();
        }

        List<Language> response = new ArrayList<>();

        // Group language entries by their type
        Map<LanguageType, List<ScriptLangProperties.LanguageProperties>> languageMap = languages.stream()
                .collect(Collectors.groupingBy(ScriptLangProperties.LanguageProperties::getLang));

        HashSet<LanguageType> disabledLanguages = new HashSet<>();

        for (var entry : languageMap.entrySet()) {
            LanguageType languageType = entry.getKey();

            if (disabledLanguages.contains(languageType)) {
                continue;
            }

            HashSet<ScriptEngineType> enabledEngines = new HashSet<>();

            for (var lang : entry.getValue()) {
                ScriptEngineType engine = lang.getEngine();
                Boolean enabled = lang.getEnabled();

                if (Boolean.FALSE.equals(enabled)) {
                    // If any entry disables the language, disable the whole language
                    disabledLanguages.add(languageType);
                    enabledEngines.clear();
                    break;
                } else {
                    if (Objects.isNull(engine)) {
                        if (Objects.isNull(languageType.getDefaultEngine())) {
                            throw new IllegalStateException(String.format("%s language has no default engine set. Engine must be specified in config.", languageType));
                        }
                        engine = languageType.getDefaultEngine();
                    }
                    enabledEngines.add(engine);
                }
            }

            // Add valid language/engine pairs
            enabledEngines.forEach(engine -> response.add(new Language(languageType, engine)));
        }

        return response;
    }

    /**
     * Returns a list of enabled languages after evaluating configuration.
     *
     * @return immutable list of enabled languages
     */
    public List<Language> enabledLanguages() {
        return Collections.unmodifiableList(enabledLanguages);
    }
}
