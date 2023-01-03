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

import com.becon.opencelium.backend.exception.EmailAlreadyExistException;
import com.becon.opencelium.backend.exception.RoleNotFoundException;
import com.becon.opencelium.backend.exception.UserNotFoundException;
import com.becon.opencelium.backend.mysql.entity.Activity;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.service.ActivityServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.mysql.service.UserServiceImpl;
import com.becon.opencelium.backend.resource.request.UserRequestResource;
import com.becon.opencelium.backend.resource.user.UserDetailResource;
import com.becon.opencelium.backend.resource.user.UserResource;
import com.becon.opencelium.backend.storage.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/user", produces = "application/hal+json", consumes = {"application/json"})
public class UserController {

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private UserRoleServiceImpl userRoleService;

    @Autowired
    private ActivityServiceImpl activityService;

    @Autowired
    private StorageService storageService;

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") int id) throws IOException {
        return userService.findById(id).map(p ->
                ResponseEntity.ok(new UserResource(p))).orElseThrow(() -> new UserNotFoundException(id));
    }

    @GetMapping("/check/{email}")
    public ResponseEntity<?> emailExists(@PathVariable("email") String email) {
        if (userService.existsByEmail(email)){
            throw new ResponseStatusException(HttpStatus.OK, "EXISTS");
        } else {
            throw new ResponseStatusException(HttpStatus.OK, "NOT_EXISTS");
        }
    }
//
    @GetMapping("/all")
    public ResponseEntity<CollectionModel<UserResource>> all(){
        final List<UserResource> userResources =
                userService.findAll().stream().map(UserResource::new).collect(Collectors.toList());
        final CollectionModel<UserResource> resources = CollectionModel.of(userResources);
        final URI uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri();
        return ResponseEntity.created(uri).body(resources);
    }
//
    @PostMapping
    public ResponseEntity<?> post(@RequestBody UserRequestResource userRequestResource) throws IOException {

        if (userService.existsByEmail(userRequestResource.getEmail())){
            throw new EmailAlreadyExistException(userRequestResource.getEmail());
        }

        if (!userRoleService.existsById(userRequestResource.getUserGroup())){
            throw new RoleNotFoundException(userRequestResource.getUserGroup());
        }

        UserDetailResource userDetailResource = userRequestResource.getUserDetail();
        if(userDetailResource.getLang() == null || userDetailResource.getLang().isEmpty()){
            userDetailResource.setLang("en");
            userRequestResource.setUserDetail(userDetailResource);
        }

        User user = userService.requestToEntity(userRequestResource);
        Activity activity = new Activity();
        activity.setUser(user);
        activity.setLocked(true);
        user.setActivity(activity);
        userService.save(user);

        UserResource userResource = userService.toResource(user);
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .path("/{id}")
                .buildAndExpand(user.getId()).toUri();

        return ResponseEntity.created(uri).body(userResource);
    }
//
    // due to frontend requirements, for all changes need to send all user data. if something will be missed it will
    // save empty values
    @PutMapping("/{id}")
    public ResponseEntity<?> update( @PathVariable("id") int id,
                                     @RequestBody UserRequestResource userRequestResource) throws IOException {

        if (!userService.existsById(id)){
            throw new UserNotFoundException(id);
        }
        userRequestResource.setUserId(id);
        UserDetailResource userDetailResource = userRequestResource.getUserDetail();
        if(userDetailResource.getLang() == null || userDetailResource.getLang().isEmpty()){
            userDetailResource.setLang("en");
            userRequestResource.setUserDetail(userDetailResource);
        }

        User user = userService.requestToEntity(userRequestResource);
        userService.save(user);

        return ResponseEntity.ok().body(userRequestResource);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") int id) {
        return userService
                .findById(id)
                .map(
                        p -> {
                            // if user has an image delete the image from storage
                            if (p.getUserDetail().getProfilePicture() != null){
                                storageService.delete(p.getUserDetail().getProfilePicture());
                            }
                            // delete user
                            userService.deleteById(id);
                            return ResponseEntity.noContent().build();
                        })
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @DeleteMapping
    public ResponseEntity<?> deleteUserByIdIn(@RequestBody List<Integer> ids) {
        ids.forEach(id -> {
            User p = userService.findById(id).orElseThrow(() -> new UserNotFoundException(id));
            if (p.getUserDetail().getProfilePicture() != null){
                storageService.delete(p.getUserDetail().getProfilePicture());
            }
            userService.deleteById(id);
        });

        return ResponseEntity.noContent().build();
    }
//
    @GetMapping("/{id}/logout")
    public ResponseEntity<?> logout(@PathVariable("id") int id) {
        return activityService
                .findById(id)
                .map(
                        p -> {
                            p.setTokenId("");
                            p.setLocked(true);
                            activityService.save(p);
                            return ResponseEntity.ok().build();
                        })
                .orElseThrow(() -> new UserNotFoundException(id));
    }
}
