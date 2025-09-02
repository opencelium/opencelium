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
    private final Map<LanguageType, Language> enabledLanguages;

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
     *
     * <p>This method reads language configurations from {@link ScriptLangProperties},
     * validates them, and builds a map of {@link LanguageType} to {@link Language}.
     *
     * <ul>
     *   <li>If no languages are configured, it returns an empty map.</li>
     *   <li>It ensures there are no duplicate language configurations.</li>
     *   <li>If an engine is not specified, it falls back to the language's default engine
     *       (if available).</li>
     *   <li>It validates that the chosen engine supports the given language.</li>
     * </ul>
     *
     * @return a map where the key is {@link LanguageType} and the value is a {@link Language}
     * @throws RuntimeException if duplicate languages are configured, if no engine is provided and no valid default engine exists,
     *          or if the engine does not support the language
     */
    private Map<LanguageType, Language> initLanguages() {
        // Retrieve the configured language list
        List<ScriptLangProperties.LanguageProperties> languages = scriptLangProperties.getLanguages();

        // If no languages are configured, return an empty map
        if (languages == null || languages.isEmpty()) {
            return Collections.emptyMap();
        }

        // Holds the final mapping of language type -> language object
        Map<LanguageType, Language> languageMap = new HashMap<>();

        // Iterate over each configured language
        for (ScriptLangProperties.LanguageProperties language : languages) {
            LanguageType lang = language.getLang();
            ScriptEngineType engine = language.getEngine();

            // Prevent duplicate language entries
            if (languageMap.containsKey(lang)) {
                throw new RuntimeException("Duplicate languages configured %s and %s"
                        .formatted(languageMap.get(lang), language));
            }

            // Validate and resolve engine
            if (engine == null) {
                // If engine is not provided in config and no default exists, fail
                if (lang.getDefaultEngine() == null) {
                    throw new RuntimeException(
                            String.format("%s language has no default engine set. Engine must be specified in config.", lang)
                    );
                }
                // Validate that the default engine supports this language
                else if (engine.getLanguages() == null ||
                        engine.getLanguages().stream().noneMatch(x -> x == lang)) {
                    throw new RuntimeException(
                            String.format("'%s' engine doesn't support '%s' language",
                                    engine.getName(), lang.getName())
                    );
                }

                // Assign default engine
                engine = lang.getDefaultEngine();
            }

            // Add the validated language and its engine to the map
            languageMap.put(lang, new Language(lang, engine));
        }

        return languageMap;
    }

    /**
     * Returns a Language object that configured via given LanguageType
     */
    public Optional<Language> findLanguage(LanguageType lang) {
        return Optional.ofNullable(enabledLanguages.get(lang));
    }

    /**
     * Returns a list of enabled languages after evaluating configuration.
     *
     * @return immutable list of enabled languages
     */
    public List<Language> enabledLanguages() {
        return enabledLanguages.values().stream().toList();
    }
}
