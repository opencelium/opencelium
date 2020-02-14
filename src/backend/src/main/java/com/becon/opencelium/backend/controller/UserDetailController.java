/*
 * Copyright (C) <2019>  <becon GmbH>
 *
 * This file is licensed under the terms of the EARLY ADOPTER PROGRAM (EAP) agreement.
 * The license agreement was sent with the confirmation of the participation of the EAP.
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
