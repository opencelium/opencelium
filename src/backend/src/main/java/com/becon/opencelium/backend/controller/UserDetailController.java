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


import com.becon.opencelium.backend.database.mysql.entity.User;
import com.becon.opencelium.backend.database.mysql.entity.UserDetail;
import com.becon.opencelium.backend.database.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.database.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.user.UserDetailResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;



@RestController
@Tag(name = "User Details", description = "Stores detailed information about users")
@RequestMapping(value = "/api/userDetail", produces = MediaType.APPLICATION_JSON_VALUE)
public class UserDetailController {

    @Autowired
    private UserDetailServiceImpl userDetailService;

    @Autowired
    private UserServiceImpl userService;

    @Operation(summary = "Updates user details")
    @ApiResponses(value = {
        @ApiResponse( responseCode = "200",
                      description = "User detail has been modified successfully.",
                      content = @Content(schema = @Schema(implementation = UserDetailResource.class))),
        @ApiResponse( responseCode = "401",
                      description = "Unauthorized",
                      content = @Content(schema = @Schema(implementation = ErrorResource.class))),
        @ApiResponse( responseCode = "500",
                      description = "Internal Error",
                      content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserDetailResource> put( @Parameter(description = "Unique identifier of User") @PathVariable("id") int id,
                                                   @RequestBody UserDetailResource userDetailResource) throws IOException {

        if (!userDetailService.existsById(id)){
            throw  new RuntimeException("USER_DETAIL_NOT_FOUND");
        }
        UserDetail userDetail = userDetailService.toEntity(userDetailResource);
        userDetail.setId(id);

        userDetailService.save(userDetail);
        User user = userService.findById(id).orElseThrow(()-> new RuntimeException("User not found"));
        userDetail.setUser(user);
        final UserDetailResource resource = new UserDetailResource(userDetail);
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(uri).body(resource);
    }
}
