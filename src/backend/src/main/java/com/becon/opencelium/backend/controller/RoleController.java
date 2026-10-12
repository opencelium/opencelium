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

import com.becon.opencelium.backend.database.mysql.service.UserRoleService;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;

@RestController
@Tag(name = "User Role(Group)", description = "Manages operations related to User Roles management")
@RequestMapping(value = "/role", produces = "application/json")
public class RoleController {

    private final UserRoleService userRoleService;

    public RoleController(UserRoleService userRoleService) {
        this.userRoleService = userRoleService;
    }


    @Operation(summary = "Retrieves a user role by provided role ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "User Role has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = UserRoleResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") int id) {
        return ResponseEntity.ok(userRoleService.getById(id));
    }

    @Operation(summary = "Retrieves all User Roles")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "User Role has been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserRoleResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<List<UserRoleResource>> all() {
        return ResponseEntity.ok(userRoleService.getAll());
    }

    @Operation(summary = "Creates new User Role")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "User Role has been successfully created",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserRoleResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserRoleResource> post(@RequestBody UserRoleResource userRoleResource) {
        UserRoleResource created = userRoleService.create(userRoleResource);

        URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(created.getGroupId())
                .toUri();

        return ResponseEntity.created(uri).body(created);
    }

    @Operation(summary = "Modifies components on an existed User Role by provided Role ID and relevant information in the request body")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Components of User Role has been successfully modified",
                    content = @Content(schema = @Schema(implementation = UserRoleResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "{id}/component", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserRoleResource> changeComponents(@PathVariable("id") int id, @RequestBody UserRoleResource userRoleResource) {
        return ResponseEntity.ok(userRoleService.updateComponents(id, userRoleResource));
    }

    @Operation(summary = "Modifies existed User Role by provided Role ID and relevant information in the request body")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "User Role has been successfully modified",
                    content = @Content(schema = @Schema(implementation = UserRoleResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserRoleResource> put(@PathVariable("id") int id, @RequestBody UserRoleResource userRoleResource) throws IOException {
        UserRoleResource updated = userRoleService.update(id, userRoleResource);

        URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(updated.getGroupId())
                .toUri();

        return ResponseEntity.created(uri).body(updated);
    }

    @Operation(summary = "Checks whether a role with the given name exists in the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Returns true if the role exists, false otherwise",
                    content = @Content(schema = @Schema(implementation = ResultDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/exists/{role}")
    public ResponseEntity<ResultDTO<Boolean>> roleExists(@PathVariable("role") String role) {
        return ResponseEntity.ok(ResultDTO.of(userRoleService.existsByName(role)));
    }

    @Operation(summary = "Deletes an User Role from system by provided role ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "User Role has been successfully deleted.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") int id) {
        userRoleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes a collection of User Roles based on the provided list of their corresponding IDs.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "List of User Roles have been successfully deleted.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "list/delete", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteRoleByIdIn(@RequestBody IdentifiersDTO<Integer> ids) {
        userRoleService.deleteAllByIds(ids.getIdentifiers());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes an icon of User Roles based on the provided role ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Icon of User Role has been successfully deleted.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}/icon")
    public ResponseEntity<?> deleteIcon(@PathVariable("id") int id) {
        userRoleService.deleteIcon(id);
        return ResponseEntity.noContent().build();
    }
}
