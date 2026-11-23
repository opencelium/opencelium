package com.becon.opencelium.backend.resource.globalvariable;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * What {@code POST /global-variable/validate-script} found: the script is checked as saving checks
 * it, then called once with the test arguments, without saving anything.
 *
 * @param valid          whether the script passed the checks and the call succeeded
 * @param result         what the call returned, as JSON; {@code null} when it did not succeed
 * @param resultJsonType the JSON type of the result: string, number, boolean, null, array or
 *                       object; {@code null} when the call did not succeed
 * @param durationMs     how long the call took; {@code null} when the script was not called
 * @param error          why the script is not valid; {@code null} when it is
 */
public record GlobalScriptTestDTO(
        boolean valid,
        JsonNode result,
        String resultJsonType,
        Long durationMs,
        Problem error) {

    /**
     * Why a script is not valid.
     *
     * @param code    SCRIPT_SYNTAX, NO_RETURN_VALUE, SCRIPT_NOT_PURE, PARAMETER_INVALID,
     *                SCRIPT_REQUIRED, LANGUAGE_NOT_SUPPORTED, MISSING_ARGUMENT, SCRIPT_RUNTIME,
     *                SCRIPT_TIMEOUT or VALIDATION_UNAVAILABLE
     * @param message text for the user
     * @param line    for a syntax error, its line in the code, from 1; {@code null} otherwise
     * @param column  for a syntax error, its column; {@code null} otherwise
     */
    public record Problem(String code, String message, Long line, Long column) {
    }

    /**
     * Body of {@code POST /global-variable/validate-script}: the script as the edit form holds
     * it, and the arguments to call it with.
     *
     * @param name          the name of the variable, for messages; may be left out
     * @param language      {@code js}; Python and Ruby cannot be tested yet
     * @param code          the body of the function
     * @param parameters    the declared parameters, as the save request has them
     * @param testArguments the arguments of the test call, in the order of the parameters, any
     *                      JSON; one left out takes its default, extra ones reach
     *                      {@code arguments}
     */
    public record Request(
            String name,
            String language,
            String code,
            List<GlobalVariableRequestDTO.Parameter> parameters,
            List<JsonNode> testArguments) {
    }

    /** Returns the answer for a call that succeeded. */
    public static GlobalScriptTestDTO passed(JsonNode result, long durationMs) {
        return new GlobalScriptTestDTO(true, result, jsonType(result), durationMs, null);
    }

    /**
     * Returns the answer for a script that is not valid.
     *
     * @param durationMs how long the failed call took; {@code null} if the script was not called
     */
    public static GlobalScriptTestDTO failed(Problem problem, Long durationMs) {
        return new GlobalScriptTestDTO(false, null, null, durationMs, problem);
    }

    private static String jsonType(JsonNode json) {
        return switch (json.getNodeType()) {
            case STRING -> "string";
            case NUMBER -> "number";
            case BOOLEAN -> "boolean";
            case ARRAY -> "array";
            case OBJECT, POJO -> "object";
            default -> "null";
        };
    }
}
