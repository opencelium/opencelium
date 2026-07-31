/*
 * // Copyright (C) <2020> <becon GmbH>
 * //
 * // This program is free software: you can redistribute it and/or modify
 * // it under the terms of the GNU General Public License as published by
 * // the Free Software Foundation, version 3 of the License.
 * //
 * // This program is distributed in the hope that it will be useful,
 * // but WITHOUT ANY WARRANTY; without even the implied warranty of
 * // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * // GNU General Public License for more details.
 * //
 * // You should have received a copy of the GNU General Public License
 * // along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

package com.becon.opencelium.backend.controller;

import com.becon.opencelium.backend.appYml.dto.ApplicationConfigPatchResponse;
import com.becon.opencelium.backend.appYml.dto.ApplicationConfigResponse;
import com.becon.opencelium.backend.appYml.service.ApplicationConfigService;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/application-config")
@Tag(name = "Application Config", description = "Read and patch the on-disk application.yml. Admin-only.")
public class ApplicationConfigController {

    private final ApplicationConfigService service;

    public ApplicationConfigController(ApplicationConfigService service) {
        this.service = service;
    }

    @Operation(summary = "Returns the current application.yml as JSON with a sidecar comments list")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Configuration successfully read",
                    content = @Content(schema = @Schema(implementation = ApplicationConfigResponse.class))),
            @ApiResponse(responseCode = "403",
                    description = "Caller is not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Failed to read application.yml",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("hasAuthority('Admin')")
    @GetMapping
    public ResponseEntity<ApplicationConfigResponse> get() {
        return ResponseEntity.ok(service.read());
    }

    @Operation(
            summary = "Applies the 'fields' array of the envelope to application.yml. Restart required to apply.",
            description = "Accepts the same envelope shape returned by GET: { fields, comments }. "
                    + "Nodes are matched by 'path' — values are edited, new keys added, and nodes "
                    + "with status 'inactive' are commented out. 'comments' is read-only and ignored "
                    + "on write; comments on disk are preserved automatically."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Configuration successfully patched",
                    content = @Content(schema = @Schema(implementation = ApplicationConfigPatchResponse.class))),
            @ApiResponse(responseCode = "400",
                    description = "Malformed JSON payload or missing 'data' field",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "403",
                    description = "Caller is not an admin",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Failed to write application.yml",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PreAuthorize("hasAuthority('Admin')")
    @PatchMapping
    public ResponseEntity<ApplicationConfigPatchResponse> patch(@RequestBody JsonNode envelope) {
        if (envelope == null || !envelope.isObject() || !envelope.has("fields")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Request body must be an object containing a 'fields' array, "
                            + "matching the shape returned by GET /application-config.");
        }
        JsonNode fields = envelope.get("fields");
        if (!fields.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "'fields' must be a JSON array.");
        }
        service.patch(fields);
        return ResponseEntity.ok(ApplicationConfigPatchResponse.saved());
    }
}
