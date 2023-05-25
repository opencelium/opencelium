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

import com.becon.opencelium.backend.exception.RoleExistsException;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.service.PermissionServiceImpl;
import com.becon.opencelium.backend.mysql.service.RoleHasPermissionServiceImp;
import com.becon.opencelium.backend.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import com.becon.opencelium.backend.storage.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@Tag(name = "User Role(Group)", description = "Manages operations related to User Roles management")
@RequestMapping(value = "/api/role", produces = "application/hal+json", consumes = {"application/json"})
public class RoleController {

    @Autowired
    private UserRoleServiceImpl userRoleService;

    @Autowired
    private RoleHasPermissionServiceImp roleHasPermissionServiceImp;

    @Autowired
    private PermissionServiceImpl permissionService;

    @Autowired
    private StorageService storageService;

    @Operation(summary = "Retrieves a user role by provided role ID")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "User Role has been successfully retrieved",
                content = @Content(schema = @Schema(implementation = UserRoleResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") int id){

        return userRoleService.findById(id)
                .map(p -> ResponseEntity.ok(new UserRoleResource(p)))
                .orElseThrow(() -> new RoleNotFoundException(id));
    }

    @Operation(summary = "Retrieves all User Roles")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "User Role has been successfully retrieved",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserRoleResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<CollectionModel<UserRoleResource>> all(){
        final List<UserRoleResource> collection =
                userRoleService.findAll().stream().map(UserRoleResource::new).collect(Collectors.toList());
        final CollectionModel<UserRoleResource> resources = CollectionModel.of(collection);
        return ResponseEntity.ok(resources);
    }

    @Operation(summary = "Creates new User Role")
    @ApiResponses(value = {
            @ApiResponse( responseCode = "200",
                    description = "User Role has been successfully created",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = UserRoleResource.class)))),
            @ApiResponse( responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse( responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping
    public ResponseEntity<UserRoleResource> post(@RequestBody UserRoleResource userRoleResource){

        if (userRoleService.existsByRole(userRoleResource.getName())){
            throw new RoleExistsException(userRoleResource.getName());
        }

        // Creating new UserGroup object. The object will be saved in db
        // Saving in db
        UserRole role = new UserRole(userRoleResource);
        UserRole userRole;
        try {
            userRoleService.save(role);
            userRoleResource.setGroupId(role.getId());
            userRole = userRoleService.toEntity(userRoleResource);
            userRoleService.save(userRole);
        }
        catch (Exception e){
            userRoleService.deleteById(role.getId());
            throw new RuntimeException(e);
        }

        UserRoleResource resource = userRoleService.toResource(userRole);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(userRole.getId()).toUri();

        return ResponseEntity.created(uri).body(resource);
    }

    @Operation(summary = "Modifies components on an existed User Role by provided Role ID and relevant information in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Components of User Role has been successfully modified",
                content = @Content(schema = @Schema(implementation = UserRoleResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("{id}/component")
    public ResponseEntity<UserRoleResource> changeComponent(@PathVariable("id") int id,
                                                             @RequestBody UserRoleResource userRoleResource) throws IOException {

        UserRole uRoleBackUp = userRoleService.findById(id).orElseThrow(() -> new RuntimeException("UserGroup id: " + id + "not found"));
        boolean isIdenticalName = uRoleBackUp.getName().equals(userRoleResource.getName());
        if (!isIdenticalName && userRoleService.existsByRole(userRoleResource.getName())){
            throw new RoleExistsException(userRoleResource.getName());
        }
        userRoleResource.setGroupId(id);
        roleHasPermissionServiceImp.deleteByUserRoleId(uRoleBackUp.getId());
        UserRole uRole;
        try {
            uRole = userRoleService.toEntity(userRoleResource);
            userRoleService.save(uRole);
        }
        catch (Exception e){
            userRoleService.save(uRoleBackUp);
            throw new RuntimeException(e);
        }
        return userRoleService.findById(id)
                .map(p -> ResponseEntity.ok(new UserRoleResource(p)))
                .orElseThrow(() -> new RoleNotFoundException(id));
    }

    @Operation(summary = "Modifies existed User Role by provided Role ID and relevant information in the request body")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "User Role has been successfully modified",
                content = @Content(schema = @Schema(implementation = UserRoleResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping("/{id}")
    public ResponseEntity<UserRoleResource> put(@PathVariable("id") int id,
                                                 @RequestBody UserRoleResource roleResource) throws IOException{

        UserRole userRole = userRoleService.findById(id).orElseThrow(() -> new RuntimeException("UserGroup id: " + id + "not found"));
        boolean isIdenticalName = userRole.getName().equals(roleResource.getName());
        if (!isIdenticalName && userRoleService.existsByRole(roleResource.getName())){
            throw new RoleExistsException(roleResource.getName());
        }
        roleResource.setGroupId(id);

        UserRole role = userRoleService.findById(id).orElseThrow(() -> new RoleNotFoundException(id));
        UserRoleResource resource = userRoleService.toResource(role);

        userRoleService.save(role);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(role.getId()).toUri();

        return ResponseEntity.created(uri).body(resource);
    }

    @Operation(summary = "Checks existence of role in OC")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Returns EXISTS or NOT_EXISTS",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/exists/{role}")
    public ResponseEntity<?> roleExists(@PathVariable("role") String role) throws IOException{
        if (userRoleService.existsByRole(role)){
            throw new ResponseStatusException(HttpStatus.OK, "EXISTS");
        } else {
            throw new ResponseStatusException(HttpStatus.OK, "NOT_EXISTS");
        }
    }

    @Operation(summary = "Deletes an User Role from system by provided role ID")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "204",
                description = "User Role has been successfully deleted."),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") int id) {
        return userRoleService
                .findById(id)
                .map(
                        p -> {

                            if (p.getIcon() != null){
                                storageService.delete(p.getIcon());
                            }

                            userRoleService.deleteById(id);
                            return ResponseEntity.noContent().build();
                        })
                .orElseThrow(() -> new RoleNotFoundException(id));
    }

    @Operation(summary = "Deletes a collection of User Roles based on the provided list of their corresponding IDs.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "204",
                description = "List of User Roles have been successfully deleted."),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping
    public ResponseEntity<?> deleteRoleByIdIn(@RequestBody List<Integer> ids) {

        ids.forEach(id -> {
            UserRole p = userRoleService.findById(id).get();
            if (p.getIcon() != null){
                storageService.delete(p.getIcon());
            }

            userRoleService.deleteById(id);
        });
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes an icon of User Roles based on the provided role ID.")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "204",
                description = "Icon of User Role has been successfully deleted."),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping("/{id}/icon")
    public ResponseEntity<?> deleteIcon(@PathVariable("id") int id) {
        return userRoleService
                .findById(id)
                .map(
                        p -> {
                            if (p.getIcon() != null){
                                storageService.delete(p.getIcon());
                                p.setIcon(null);
                                userRoleService.save(p);
                            }
                            return ResponseEntity.noContent().build();
                        })
                .orElseThrow(() -> new RoleNotFoundException(id));
    }
}
