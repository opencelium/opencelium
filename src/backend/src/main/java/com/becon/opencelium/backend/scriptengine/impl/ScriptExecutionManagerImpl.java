package com.becon.opencelium.backend.scriptengine.impl;

import com.becon.opencelium.backend.scriptengine.*;
import com.becon.opencelium.backend.scriptengine.engines.PolyglotEngine;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ScriptExecutionManagerImpl implements ScriptExecutionManager {

    private final ScriptEngineProvider scriptEngineProvider;

    public ScriptExecutionManagerImpl(ScriptEngineProvider scriptEngineProvider) {
        this.scriptEngineProvider = scriptEngineProvider;
    }

    private Optional<ScriptEngine> resolveEngine(Language lang) {
        Optional<ScriptEngine> engineOpt = scriptEngineProvider.provide(lang);

        if (engineOpt.isPresent() && lang.getEngine() == ScriptEngineType.POLYGOT_ENGINE) {
            PolyglotEngine polyglotEngine = (PolyglotEngine) engineOpt.get();

            polyglotEngine.setLanguageType(lang.getLanguage());
            return Optional.of(polyglotEngine);
        }

        return engineOpt;
    }

    @Override
    public Optional<ScriptEngine> resolveEngine(LanguageType lang) {
        return resolveEngine(new Language(lang, lang.getDefaultEngine()));
    }
}
