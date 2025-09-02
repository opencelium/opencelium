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
     * @return a map of enabled {@link Language} objects
     */
    private Map<LanguageType, Language> initLanguages() {
        List<ScriptLangProperties.LanguageProperties> languages = scriptLangProperties.getLanguages();

        if (languages == null || languages.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<LanguageType, Language> languageMap = new HashMap<>();

        for (ScriptLangProperties.LanguageProperties language : languages) {
            LanguageType lang = language.getLang();
            ScriptEngineType engine = language.getEngine();

            if (languageMap.containsKey(lang)) {
                throw new RuntimeException("Duplicate languages configured %s and %s".formatted(languageMap.get(lang), language));
            }

            if (engine == null) {
                if (lang.getDefaultEngine() == null) {

                    throw new IllegalStateException(String.format("%s language has no default engine set. Engine must be specified in config.", lang));
                } else if (engine.getLanguages() == null || engine.getLanguages().stream().noneMatch(x -> x == lang)) {

                    throw new IllegalStateException(String.format("'%s' engine doesn't support '%s' language", engine.getName(), lang.getName()));
                }

                engine = lang.getDefaultEngine();
            }

            languageMap.put(lang, new Language(lang, engine));
        }

        return languageMap;
    }

    public Optional<Language> findLanguage(LanguageType lang) {
        return Optional.ofNullable(enabledLanguages.get(lang));
    }
}
