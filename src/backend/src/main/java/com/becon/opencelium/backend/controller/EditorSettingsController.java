package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.EditorSettings;
import com.becon.opencelium.backend.database.mysql.service.EditorSettingsService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.EditorSettingsDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.net.URI;

@RestController
@RequestMapping("api/editor/settings")
@Tag(name = "Category", description = "Manages operations related to Editor Settings management")
public class EditorSettingsController {

    private final EditorSettingsService editorSettingsService;
    private final Mapper<EditorSettings, EditorSettingsDTO> mapper;

    public EditorSettingsController(@Qualifier("editorSettingsServiceImp") EditorSettingsService editorSettingsService, Mapper<EditorSettings, EditorSettingsDTO> mapper) {
        this.editorSettingsService = editorSettingsService;
        this.mapper = mapper;
    }

    @Operation(summary = "Creates or Updates an editor settings")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201",
                    description = "Editor Settings has been successfully created(updated)",
                    content = @Content(schema = @Schema(implementation = EditorSettingsDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping
    public ResponseEntity<EditorSettingsDTO> save(@RequestBody EditorSettingsDTO settingsDto) {
        EditorSettings saved = editorSettingsService.save(settingsDto);

        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();
        return ResponseEntity.created(uri)
                .body(mapper.toDTO(saved));
    }

    @Operation(summary = "Retrieves editor settings from database by provided user ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Editor Settings has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = EditorSettingsDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/user/{userId}")
    public ResponseEntity<EditorSettingsDTO> getSettings(@PathVariable("userId") Integer userId) {
        EditorSettings settings = editorSettingsService.getByUserId(userId);
        return ResponseEntity.ok(mapper.toDTO(settings));
    }
}
