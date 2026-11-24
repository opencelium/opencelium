package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.scriptengine.client.ScriptLanguageService;
import com.becon.opencelium.backend.resource.languages.ScriptLanguageDTO;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionRequest;
import com.becon.opencelium.backend.resource.languages.ScriptExecutionResultDTO;
import com.becon.opencelium.backend.resource.languages.ScriptValidationRequest;
import com.becon.opencelium.backend.resource.languages.ScriptValidationResultDTO;
import com.becon.opencelium.backend.scriptengine.client.ScriptRunService;
import com.becon.opencelium.backend.scriptengine.client.ScriptValidationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/lang-code")
@Tag(name = "Languages", description = "Operations related to Languages")
public class LanguageController {

    private final ScriptLanguageService scriptLanguageService;
    private final ScriptValidationService scriptValidationService;
    private final ScriptRunService scriptRunService;

    public LanguageController(ScriptLanguageService scriptLanguageService,
                              ScriptValidationService scriptValidationService,
                              ScriptRunService scriptRunService) {
        this.scriptLanguageService = scriptLanguageService;
        this.scriptValidationService = scriptValidationService;
        this.scriptRunService = scriptRunService;
    }

    @Operation(summary = "Returns All Supported Programming Languages")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Languages have been successfully retrieved",
                    content = @Content(
                            array = @ArraySchema(
                                    schema = @Schema(implementation = ScriptLanguageDTO.class)
                            )
                    )
            ),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<ResultDTO<List<ScriptLanguageDTO>>> getLanguages() {
        return ResponseEntity.ok(
                ResultDTO.of(scriptLanguageService.getAllLanguages())
        );
    }

    @Operation(summary = "Checks the syntax of a script without executing it",
            description = "Compiles the script with the language's engine. An invalid script is "
                    + "reported with 200 and valid = false, together with the line, column and a "
                    + "hint on how to fix it. Only 'js' (ES5.1) can be checked.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "The script has been checked",
                    content = @Content(schema = @Schema(implementation = ScriptValidationResultDTO.class))),
            @ApiResponse(responseCode = "400",
                    description = "Script is empty or too large, or the language cannot be checked",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping("/validate")
    public ResponseEntity<ScriptValidationResultDTO> validateScript(
            @RequestBody ScriptValidationRequest request) {
        return ResponseEntity.ok(scriptValidationService.validate(request));
    }

    @Operation(summary = "Runs a script with test values for its variables",
            description = "Runs the script in a sandbox (no Java access, no load/quit/exit) with "
                    + "the given variable values and returns the value of its last expression, "
                    + "which is what an execution would use. A failing script is reported with "
                    + "200 and success = false, together with the error type, line and a hint. "
                    + "Only 'js' (ES5.1) can be run.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "The script has been run",
                    content = @Content(schema = @Schema(implementation = ScriptExecutionResultDTO.class))),
            @ApiResponse(responseCode = "400",
                    description = "Script or variables are empty, too large or invalid, or the language cannot be run",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "429",
                    description = "Too many scripts are running",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping("/execute")
    public ResponseEntity<ScriptExecutionResultDTO> executeScript(
            @RequestBody ScriptExecutionRequest request) {
        return ResponseEntity.ok(scriptRunService.run(request));
    }
}
