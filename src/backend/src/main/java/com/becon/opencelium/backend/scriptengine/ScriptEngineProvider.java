package com.becon.opencelium.backend.scriptengine;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ScriptEngineProvider {

    private final List<ScriptEngine> engines;

    public ScriptEngineProvider(List<ScriptEngine> engines) {
        this.engines = engines;
    }

    public Optional<ScriptEngine> provide(Language lang) {
        return engines.stream()
                .filter(x -> x.supports(lang))
                .findFirst();
    }
}