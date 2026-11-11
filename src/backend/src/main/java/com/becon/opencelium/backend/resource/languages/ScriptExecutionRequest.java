package com.becon.opencelium.backend.resource.languages;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Request body for running an enhancement script with test values for its variables.
 *
 * @param language code of the script language (see {@code LanguageType}); {@code js} when absent
 * @param script the source code typed by the user
 * @param variables a value for each variable the script reads; any JSON value
 */
@Schema(description = "Script to run and the values of its variables")
public record ScriptExecutionRequest(
    @Schema(description = "Language code; defaults to 'js'", example = "js") String language,
    @Schema(description = "Source code to run", example = "RESULT_VAR = VAR_0 + VAR_1.id")
        String script,
    @Schema(
            description = "Variable name to value; any JSON value",
            example = "{\"VAR_0\": 10, \"VAR_1\": {\"id\": 7}}")
        Map<String, Object> variables) {

  public ScriptExecutionRequest {
    // Map.copyOf rejects null values, but null is a legitimate variable value.
    variables =
        variables == null
            ? Map.of()
            : Collections.unmodifiableMap(new LinkedHashMap<>(variables));
  }
}
