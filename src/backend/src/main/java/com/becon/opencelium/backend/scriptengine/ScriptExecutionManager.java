package com.becon.opencelium.backend.scriptengine;

import java.util.Optional;

/**
 * Defines the contract for managing and resolving script execution engines.
 * Provides methods to query available languages and check engine availability.
 */
public interface ScriptExecutionManager {

    /**
     * Resolves an appropriate {@link ScriptEngine} for the given language type.
     *
     * @param lang language
     * @return an {@link Optional} containing a matching {@code ScriptEngine}, or empty if none is available
     */
    Optional<ScriptEngine> resolveEngine(LanguageType lang);
}
