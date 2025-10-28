package com.becon.opencelium.backend.scriptengine;

import com.becon.opencelium.backend.scriptengine.engines.NashornEngine;
import com.becon.opencelium.backend.scriptengine.engines.PolyglotEngine;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
public class ScriptEngineProvider {

    private final List<ObjectProvider<? extends ScriptEngine>> engineProviders;

    public ScriptEngineProvider(ObjectProvider<PolyglotEngine> polyglotEngineProvider, ObjectProvider<NashornEngine> nashornEngineProvider) {
        List<ObjectProvider<? extends ScriptEngine>> providers = new ArrayList<>();
        providers.add(polyglotEngineProvider);
        providers.add(nashornEngineProvider);

        this.engineProviders = Collections.unmodifiableList(providers);
    }

    public Optional<ScriptEngine> provide(Language lang) {
        return engineProviders.stream()
                .map(ObjectProvider::getObject)
                .filter(engine -> engine.supports(lang))
                .findFirst()
                .map(engine -> (ScriptEngine) engine);
    }
}