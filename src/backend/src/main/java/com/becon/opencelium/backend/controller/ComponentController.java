/*
 * // Copyright (C) <2019> <becon GmbH>
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

import com.becon.opencelium.backend.mysql.entity.Component;
import com.becon.opencelium.backend.mysql.service.ComponentServiceImpl;
import com.becon.opencelium.backend.resource.user.ComponentResource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Resources;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/component", produces = "application/hal+json", consumes = {"application/json"})
public class ComponentController {

    @Autowired
    private ComponentServiceImpl componentService;

    @GetMapping("/all")
    public ResponseEntity<Resources<ComponentResource>> all(){

        final List<ComponentResource> collection =
                componentService.findAll().stream().map(ComponentResource::new).collect(Collectors.toList());

        final Resources<ComponentResource> resources = new Resources<>(collection);
        final String uriString = ServletUriComponentsBuilder.fromCurrentRequest().build().toUriString();
        return ResponseEntity.ok(resources);
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
