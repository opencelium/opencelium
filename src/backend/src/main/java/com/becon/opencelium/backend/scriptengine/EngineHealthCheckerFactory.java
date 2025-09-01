package com.becon.opencelium.backend.scriptengine;

public class EngineHealthCheckerFactory {
    public static EngineHealthChecker getHealthChecker(ScriptEngineType engineType) {
        if (engineType == ScriptEngineType.GRAALVM) {
            return new GraalVMHealthChecker();
        }
        return null;
    }
}
