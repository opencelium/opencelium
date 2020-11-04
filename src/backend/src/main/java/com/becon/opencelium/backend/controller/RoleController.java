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
import com.becon.opencelium.backend.mysql.entity.Component;
import com.becon.opencelium.backend.mysql.entity.RoleHasPermission;
import com.becon.opencelium.backend.mysql.entity.User;
import com.becon.opencelium.backend.mysql.entity.UserRole;
import com.becon.opencelium.backend.mysql.service.PermissionServiceImpl;
import com.becon.opencelium.backend.mysql.service.RoleHasPermissionServiceImp;
import com.becon.opencelium.backend.mysql.service.UserRoleServiceImpl;
import com.becon.opencelium.backend.resource.user.ComponentResource;
import com.becon.opencelium.backend.resource.user.UserRoleResource;
import com.becon.opencelium.backend.storage.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Resources;
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

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable("id") int id){

        return userRoleService.findById(id)
                .map(p -> ResponseEntity.ok(new UserRoleResource(p)))
                .orElseThrow(() -> new RoleNotFoundException(id));
    }

    @GetMapping("/all")
    public ResponseEntity<Resources<UserRoleResource>> all(){
        final List<UserRoleResource> collection =
                userRoleService.findAll().stream().map(UserRoleResource::new).collect(Collectors.toList());
        final Resources<UserRoleResource> resources = new Resources<>(collection);
        return ResponseEntity.ok(resources);
    }

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

    @PutMapping("{id}/component")
    public ResponseEntity<UserRoleResource> changeComponent(@PathVariable("id") int id,
                                                             @RequestBody UserRoleResource userRoleResource) throws IOException {

        UserRole userRole = userRoleService.findById(id).orElseThrow(() -> new RuntimeException("UserGroup id: " + id + "not found"));
        boolean isIdenticalName = userRole.getName().equals(userRoleResource.getName());
        if (!isIdenticalName && userRoleService.existsByRole(userRoleResource.getName())){
            throw new RoleExistsException(userRoleResource.getName());
        }
        userRoleResource.setGroupId(id);

        // First of all we need to delete old relations between user_group and component
//        for (RoleHasPermission roleHasPermission : userRole.getComponents()) {
//            roleHasPermissionServiceImp.delete(roleHasPermission.getId());
            roleHasPermissionServiceImp.deleteByUserRole(userRole);
//        }
        // Creating new UserGroup object from groupJson
        UserRole role = userRoleService.toEntity(userRoleResource);
        role.setIcon(userRoleService.findById(id).get().getIcon());
        UserRole userRole0 = userRoleService.findById(id).orElse(null);
        userRoleService.save(role);

//        UserRole role1 = userRoleService.findById(id).get();
//        UserRoleResource resource = userRoleService.toResource(role1);
//        final URI uri = MvcUriComponentsBuilder
//                .fromController(getClass())
//                .path("/{id}")
//                .buildAndExpand(role.getId()).toUri();

        UserRole userRole1 = userRoleService.findById(id).orElse(null);
        return userRoleService.findById(id)
                .map(p -> ResponseEntity.ok(new UserRoleResource(p)))
                .orElseThrow(() -> new RoleNotFoundException(id));
    }

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

    @GetMapping("/exists/{role}")
    public ResponseEntity<?> roleExists(@PathVariable("role") String role) throws IOException{
        if (userRoleService.existsByRole(role)){
            throw new ResponseStatusException(HttpStatus.OK, "EXISTS");
        } else {
            throw new ResponseStatusException(HttpStatus.OK, "NOT_EXISTS");
        }
    }

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

    @DeleteMapping("/{id}/icon/{icon}")
    public ResponseEntity<?> deleteIcon(@PathVariable("id") int id, @PathVariable("icon") String icon) {
        storageService.delete(icon);
        return ResponseEntity.noContent().build();
    }
}
