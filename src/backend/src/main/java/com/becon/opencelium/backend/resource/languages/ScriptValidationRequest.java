package com.becon.opencelium.backend.resource.languages;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Request body for checking the syntax of an enhancement script without executing it.
 *
 * @param language code of the script language (see {@code LanguageType}); {@code js} when absent
 * @param script the source code typed by the user
 */
@Schema(description = "Script whose syntax should be checked")
public record ScriptValidationRequest(
    @Schema(description = "Language code; defaults to 'js'", example = "js") String language,
    @Schema(description = "Source code to check", example = "var a = 1;\nvar b = a +;")
        String script) {}
