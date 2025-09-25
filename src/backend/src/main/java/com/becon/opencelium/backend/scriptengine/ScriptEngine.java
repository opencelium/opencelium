package com.becon.opencelium.backend.scriptengine;

import com.becon.opencelium.backend.scriptengine.ex.InvalidScriptException;
import com.becon.opencelium.backend.scriptengine.ex.ScriptExecutionException;

import java.util.Map;
import java.util.function.Function;

/**
 * Defines the contract for executing and validating scripts written in supported languages.
 * Implementations of this interface provide language-specific execution logic and context binding.
 */
public interface ScriptEngine {

    /**
     * Determines whether this engine supports the given language configuration.
     *
     * @param lang the language and engine configuration
     * @return {@code true} if supported; {@code false} otherwise
     */
    boolean supports(Language lang);

    /**
     * Executes the given script without any bindings.
     *
     * @param script the script to execute
     * @return the result of the script execution
     * @throws ScriptExecutionException if an error occurs during execution
     * @throws InvalidScriptException if the script is syntactically invalid
     */
    Object execute(String script)
            throws ScriptExecutionException, InvalidScriptException;

    /**
     * Executes the given script with the provided variable bindings.
     *
     * @param script the script to execute
     * @param bindings a map of variable names to values to inject into the script context
     * @return the result of the script execution
     * @throws ScriptExecutionException if an error occurs during execution
     * @throws InvalidScriptException if the script is syntactically invalid
     */
    Object execute(String script, Map<String, Object> bindings)
            throws ScriptExecutionException, InvalidScriptException;

    /**
     * Executes the given script with bindings and dynamic reference resolution.
     *
     * @param script the script to execute
     * @param bindings a map of variable names to reference keys
     * @param refExtractor a function to resolve reference values from keys
     * @return the result of the script execution
     * @throws ScriptExecutionException if an error occurs during execution
     * @throws InvalidScriptException if the script is syntactically invalid
     */
    Object execute(String script, Map<String, String> bindings, Function<String, Object> refExtractor)
            throws ScriptExecutionException, InvalidScriptException;

    /**
     * Validates the given script for syntax errors without executing it.
     *
     * @param script the script to validate
     * @throws InvalidScriptException if the script is syntactically invalid
     */
    void validate(String script) throws InvalidScriptException;

    /**
     * Checks whether the script engine is available and ready to execute scripts.
     *
     * @return {@code true} if the engine is operational; {@code false} otherwise
     */
    boolean isUp();
}
