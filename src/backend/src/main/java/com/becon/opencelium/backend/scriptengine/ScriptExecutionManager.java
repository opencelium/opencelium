package com.becon.opencelium.backend.scriptengine;

import java.util.List;
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

    /**
     * Returns a list of all languages supported by registered script engines.
     *
     * @return a list of supported {@link Language} instances
     */
    List<Language> availableLanguages();

    /**
     * Checks if a script engine is available for the given language configuration.
     *
     * @param lang the language and engine configuration to check
     * @return {@code true} if an engine is available; {@code false} otherwise
     */
    boolean isEngineAvailable(Language lang);
}
