package com.becon.opencelium.backend.resource.languages;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Outcome of running a script with test values.
 *
 * @param success {@code true} when the script ran and produced a result
 * @param language code of the language the script ran in
 * @param result the value an execution would use: the value of the script's last expression
 * @param resultType JSON type of {@code result}; {@code null} when the run failed
 * @param output what the script wrote with {@code print}
 * @param durationMs how long the run took, in milliseconds
 * @param error why the run failed; {@code null} on success
 */
@Schema(description = "Result of running a script")
public record ScriptExecutionResultDTO(
    boolean success,
    String language,
    @Schema(description = "Value of the script's last expression; any JSON value") Object result,
    @Schema(
            description = "JSON type of result",
            allowableValues = {"string", "number", "boolean", "object", "array", "null"})
        String resultType,
    @Schema(description = "Text written with print()") String output,
    long durationMs,
    ScriptExecutionErrorDTO error) {

  /** Returns the result of a run that produced a value. */
  public static ScriptExecutionResultDTO success(
      String language, Object result, String resultType, String output, long durationMs) {
    return new ScriptExecutionResultDTO(
        true, language, result, resultType, output, durationMs, null);
  }

  /** Returns the result of a run that failed with the given error. */
  public static ScriptExecutionResultDTO failure(
      String language, String output, long durationMs, ScriptExecutionErrorDTO error) {
    return new ScriptExecutionResultDTO(false, language, null, null, output, durationMs, error);
  }

  /** Stage of the run at which a script failed. */
  public enum ErrorType {
    /** The script does not compile. */
    SYNTAX,
    /** The script threw while running. */
    RUNTIME,
    /** The script ran longer than allowed. */
    TIMEOUT,
    /** The script's result cannot be represented as JSON. */
    RESULT
  }

  /**
   * Why a script run failed.
   *
   * @param type the stage at which the run failed
   * @param name the JavaScript error name, e.g. {@code TypeError}; {@code null} when there is none
   * @param line 1-based line of the problem, or {@code null} when unknown
   * @param column 1-based column of the problem, or {@code null} when unknown
   * @param message the engine's description of the problem
   * @param codeLine the source line containing the problem, or {@code null} when unknown
   * @param hint a suggestion telling the user how to fix the problem
   */
  @Schema(description = "Why the script run failed")
  public record ScriptExecutionErrorDTO(
      ErrorType type,
      @Schema(description = "JavaScript error name", example = "ReferenceError") String name,
      @Schema(description = "1-based line number", example = "1") Integer line,
      @Schema(description = "1-based column number") Integer column,
      @Schema(description = "Message from the script engine",
          example = "\"VAR_2\" is not defined") String message,
      @Schema(description = "Source line containing the problem") String codeLine,
      @Schema(description = "How the user can fix the problem") String hint) {}
}
