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


import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.UserDetail;
import com.becon.opencelium.backend.mysql.service.UserDetailServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.user.UserDetailResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;


@RestController
@RequestMapping(value = "/api/userDetail", produces = "application/hal+json",
                                           consumes = {"multipart/form-data", "application/json"})
public class UserDetailController {

    @Autowired
    private UserDetailServiceImpl userDetailService;

    @Autowired
    private UserServiceImpl userService;

    @PutMapping("/{id}")
    public ResponseEntity<UserDetailResource> put( @PathVariable("id") int id,
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
