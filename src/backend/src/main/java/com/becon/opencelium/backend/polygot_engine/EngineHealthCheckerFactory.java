package com.becon.opencelium.backend.polygot_engine;

public class EngineHealthCheckerFactory {
    public static EngineHealthChecker getHealthChecker(ScriptEngineType engineType) {
        if (engineType == ScriptEngineType.GRAALVM) {
            return new GraalVMHealthChecker();
        }
        return null;
    }
}
