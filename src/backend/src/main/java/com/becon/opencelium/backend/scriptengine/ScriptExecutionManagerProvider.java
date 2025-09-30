package com.becon.opencelium.backend.scriptengine;

import com.becon.opencelium.backend.scriptengine.config.LanguageConfig;
import com.becon.opencelium.backend.scriptengine.impl.ScriptExecutionManagerImpl;
import org.springframework.stereotype.Component;

@Component
public class ScriptExecutionManagerProvider {

    private static ScriptExecutionManager instance;

    public ScriptExecutionManagerProvider(LanguageConfig languageConfig,
                                          ScriptEngineProvider scriptEngineProvider) {
        // initialize only once
        instance = new ScriptExecutionManagerImpl(languageConfig, scriptEngineProvider);
    }

    public static ScriptExecutionManager get() {
        if (instance == null) {
            throw new IllegalStateException("ScriptExecutionManager is not initialized yet!");
        }
        return instance;
    }
}
