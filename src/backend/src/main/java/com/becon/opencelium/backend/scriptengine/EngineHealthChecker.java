package com.becon.opencelium.backend.scriptengine;

public interface EngineHealthChecker {

    /**
     * Checks whether the script engine is available and ready to execute scripts.
     *
     * @return {@code true} if the engine is operational; {@code false} otherwise
     */
    boolean check();
}