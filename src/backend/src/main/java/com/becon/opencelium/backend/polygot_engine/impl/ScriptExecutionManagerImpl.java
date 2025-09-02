package com.becon.opencelium.backend.polygot_engine.impl;

import com.becon.opencelium.backend.polygot_engine.Language;
import com.becon.opencelium.backend.polygot_engine.LanguageType;
import com.becon.opencelium.backend.polygot_engine.ScriptEngine;
import com.becon.opencelium.backend.polygot_engine.ScriptEngineFactory;
import com.becon.opencelium.backend.polygot_engine.ScriptExecutionManager;
import com.becon.opencelium.backend.polygot_engine.config.LanguageConfig;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Component
public class ScriptExecutionManagerImpl implements ScriptExecutionManager {

    private final LanguageConfig languageConfig;
    private final ScriptEngineFactory scriptEngineFactory;

    public ScriptExecutionManagerImpl(LanguageConfig languageConfig, ScriptEngineFactory scriptEngineFactory) {
        this.languageConfig = languageConfig;
        this.scriptEngineFactory = scriptEngineFactory;
    }

    private Optional<ScriptEngine> resolveEngine(Language lang) {
        return scriptEngineFactory.getEngine(lang);
    }

    @Override
    public Optional<ScriptEngine> resolveEngine(LanguageType lang) {
        return languageConfig.findLanguage(lang)
                .flatMap(this::resolveEngine);
    }

    @Override
    public List<Language> availableLanguages() {
        return languageConfig.enabledLanguages();
    }

    @Override
    public boolean isEngineAvailable(Language lang) {
        Optional<Language> language = languageConfig.findLanguage(lang.getLanguage());

        return language.isPresent() && Objects.equals(lang, language.get());
    }
}
