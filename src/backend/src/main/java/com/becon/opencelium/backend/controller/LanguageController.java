package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.scriptengine.client.ScriptLanguageService;
import com.becon.opencelium.backend.resource.languages.ScriptLanguageDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/lang-code")
@Tag(name = "Languages", description = "Operations related to Languages")
public class LanguageController {

    private final ScriptLanguageService scriptLanguageService;

    public LanguageController(ScriptLanguageService scriptLanguageService) {
        this.scriptLanguageService = scriptLanguageService;
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
}
