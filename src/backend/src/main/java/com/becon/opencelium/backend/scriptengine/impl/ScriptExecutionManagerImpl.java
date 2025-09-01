package com.becon.opencelium.backend.scriptengine.impl;

import com.becon.opencelium.backend.scriptengine.Language;
import com.becon.opencelium.backend.scriptengine.LanguageType;
import com.becon.opencelium.backend.scriptengine.ScriptEngine;
import com.becon.opencelium.backend.scriptengine.ScriptEngineProvider;
import com.becon.opencelium.backend.scriptengine.ScriptExecutionManager;
import com.becon.opencelium.backend.scriptengine.config.LanguageConfig;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ScriptExecutionManagerImpl implements ScriptExecutionManager {

    private final LanguageConfig languageConfig;
    private final ScriptEngineProvider scriptEngineProvider;

    public ScriptExecutionManagerImpl(LanguageConfig languageConfig, ScriptEngineProvider scriptEngineProvider) {
        this.languageConfig = languageConfig;
        this.scriptEngineProvider = scriptEngineProvider;
    }

    private Optional<ScriptEngine> resolveEngine(Language lang) {
        return scriptEngineProvider.provide(lang);
    }

    @Override
    public Optional<ScriptEngine> resolveEngine(LanguageType lang) {
        return languageConfig.enabledLanguages()
                .stream()
                .filter(x -> x.getLanguage() == lang)
                .findFirst()
                .flatMap(this::resolveEngine);
    }

    @Override
    public List<Language> availableLanguages() {
        return languageConfig.enabledLanguages();
    }

    @Override
    public boolean isEngineAvailable(Language lang) {
        return languageConfig.enabledLanguages()
                .stream()
                .anyMatch(x -> x.equals(lang));
    }
}
