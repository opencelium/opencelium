package com.becon.opencelium.backend.polygot_engine;

import java.util.List;
import java.util.Optional;

public interface ScriptExecutionManager {
    Optional<ScriptEngine> resolveEngine(Language lang);

    List<Language> availableLanguages();

    boolean isEngineAvailable(Language lang);
}