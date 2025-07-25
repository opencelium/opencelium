package com.becon.opencelium.backend.polygot_engine;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ScriptEngineFactory {

    private final List<ScriptEngine> engines;

    public ScriptEngineFactory(List<ScriptEngine> engines) {
        this.engines = engines;
    }

    public Optional<ScriptEngine> getEngine(Language lang) {
        return engines.stream()
                .filter(x -> x.supports(lang))
                .findFirst();
    }
}