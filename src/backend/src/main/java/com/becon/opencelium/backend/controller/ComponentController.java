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

import com.becon.opencelium.backend.database.mysql.service.ComponentServiceImpl;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.ComponentResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Application Components", description = "Manages operations related to Application Components management")
@RequestMapping(value = "/api/component", produces = MediaType.APPLICATION_JSON_VALUE)
public class ComponentController {

    @Autowired
    private ComponentServiceImpl componentService;

    @Operation(summary = "Retrieves all Components of Application."
            )
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                description = "Application Components have been successfully retrieved.",
                content = @Content(array = @ArraySchema(schema = @Schema(implementation = ComponentResource.class)))),
        @ApiResponse( responseCode = "401",
                description = "Unauthorized",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                description = "Internal Error",
                content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/all")
    public ResponseEntity<List<ComponentResource>> all(){

        final List<ComponentResource> collection =
                componentService.findAll().stream().map(ComponentResource::new).collect(Collectors.toList());
        return ResponseEntity.ok(collection);
    }

//    @PostMapping
//    public ResponseEntity<ComponentResource> post(@RequestBody ComponentResource componentResource) throws IOException {
//
//        Component component = componentService.
//
//        ComponentResource componentResource = new ComponentResource(component);
//        final URI uri = MvcUriComponentsBuilder
//                .fromController(getClass())
//                .path("/{id}")
//                .buildAndExpand(component.getId()).toUri();
//
//        return ResponseEntity.created(uri).body(componentResource);
//    }
}
