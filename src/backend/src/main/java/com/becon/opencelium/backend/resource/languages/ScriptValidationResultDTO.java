package com.becon.opencelium.backend.resource.languages;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Outcome of a script syntax check.
 *
 * @param valid {@code true} when the engine accepted the script
 * @param language code of the language the script was checked against
 * @param errors problems found; empty when the script is valid
 */
@Schema(description = "Result of a script syntax check")
public record ScriptValidationResultDTO(
    boolean valid, String language, List<ScriptErrorDTO> errors) {

  public ScriptValidationResultDTO {
    errors = errors == null ? List.of() : List.copyOf(errors);
  }

  /** Returns the result for a script the engine accepted. */
  public static ScriptValidationResultDTO valid(String language) {
    return new ScriptValidationResultDTO(true, language, List.of());
  }

  /** Returns the result for a script the engine rejected with the given error. */
  public static ScriptValidationResultDTO invalid(String language, ScriptErrorDTO error) {
    return new ScriptValidationResultDTO(false, language, List.of(error));
  }

  /**
   * One syntax problem reported by the script engine.
   *
   * @param line 1-based line of the problem, or {@code null} when the engine did not report it
   * @param column 1-based column of the problem, or {@code null} when the engine did not report it
   * @param message the engine's description of the problem
   * @param codeLine the source line containing the problem, or {@code null} when unknown
   * @param hint a suggestion telling the user how to fix the problem
   */
  @Schema(description = "A syntax problem found in the script")
  public record ScriptErrorDTO(
      @Schema(description = "1-based line number", example = "2") Integer line,
      @Schema(description = "1-based column number", example = "12") Integer column,
      @Schema(description = "Message from the script engine",
          example = "Expected an operand but found ;") String message,
      @Schema(description = "Source line containing the problem", example = "var b = a +;")
          String codeLine,
      @Schema(description = "How the user can fix the problem") String hint) {}
}
