package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.database.mysql.entity.SystemSetting;
import com.becon.opencelium.backend.database.mysql.service.SystemSettingService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.resource.SystemSettingDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Global, admin-managed settings that apply to every user (e.g. the system-wide UI theme
 * {@code theme_colors}). Writes are admin-only; reads are admin-only unless the setting is
 * whitelisted as user-readable in {@link com.becon.opencelium.backend.security.SystemSettingSecurity}.
 * See {@code docs/settings/system-settings.md} for the design decision and trade-offs.
 */
@RestController
@Tag(name = "System Settings", description = "Global settings applied for all users, managed by admins")
@RequestMapping(value = "/system-setting", produces = MediaType.APPLICATION_JSON_VALUE)
public class SystemSettingController {

    private final SystemSettingService systemSettingService;

    public SystemSettingController(SystemSettingService systemSettingService) {
        this.systemSettingService = systemSettingService;
    }

    @Operation(summary = "Retrieves a system setting by name")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "System setting has been retrieved successfully.",
                    content = @Content(schema = @Schema(implementation = SystemSettingDTO.class))),
            @ApiResponse(responseCode = "403",
                    description = "Setting is not user-readable and caller is not an admin.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "404",
                    description = "Setting does not exist.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("hasAuthority('Admin') or @systemSettingSecurity.isUserReadable(#name)")
    @GetMapping("/{name}")
    public ResponseEntity<SystemSettingDTO> get(
            @Parameter(description = "Unique name of the setting") @PathVariable("name") String name) {
        SystemSetting setting = systemSettingService.find(name)
                .orElseThrow(() -> new GeneralServiceException(HttpStatus.NOT_FOUND,
                        "SYSTEM_SETTING_NOT_FOUND", "System setting '" + name + "' does not exist"));
        return ResponseEntity.ok(new SystemSettingDTO(setting, systemSettingService.toJson(setting)));
    }

    @Operation(summary = "Creates or updates a system setting. Admin-only.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "System setting has been saved successfully.",
                    content = @Content(schema = @Schema(implementation = SystemSettingDTO.class))),
            @ApiResponse(responseCode = "400",
                    description = "Value is missing, JSON null, or longer than 1024 characters when serialized.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "403",
                    description = "Caller is not an admin.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("hasAuthority('Admin')")
    @PutMapping(value = "/{name}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SystemSettingDTO> put(
            @Parameter(description = "Unique name of the setting") @PathVariable("name") String name,
            @Valid @RequestBody SystemSettingDTO body) {
        SystemSetting saved = systemSettingService.save(name, body.getValue());
        return ResponseEntity.ok(new SystemSettingDTO(saved, systemSettingService.toJson(saved)));
    }

    @Operation(summary = "Deletes a system setting so clients fall back to their defaults. Admin-only.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "System setting has been deleted (or did not exist)."),
            @ApiResponse(responseCode = "403",
                    description = "Caller is not an admin.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("hasAuthority('Admin')")
    @DeleteMapping("/{name}")
    public ResponseEntity<Void> delete(
            @Parameter(description = "Unique name of the setting") @PathVariable("name") String name) {
        systemSettingService.delete(name);
        return ResponseEntity.noContent().build();
    }
}
