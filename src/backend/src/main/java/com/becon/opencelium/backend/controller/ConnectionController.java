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

import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.EnhancementServiceImp;
import com.becon.opencelium.backend.neo4j.entity.ConnectionNode;
import com.becon.opencelium.backend.neo4j.entity.EnhancementNode;
import com.becon.opencelium.backend.neo4j.entity.relation.LinkRelation;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.EnhancementNodeServiceImp;
import com.becon.opencelium.backend.neo4j.service.LinkRelationServiceImp;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.error.validation.ErrorMessageDataResource;
import com.becon.opencelium.backend.resource.error.validation.ValidationResource;
import com.becon.opencelium.backend.validation.connection.ValidationContext;
import com.becon.opencelium.backend.validation.connection.entity.ErrorMessageData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/connection", produces = "application/hal+json", consumes = "application/json")
public class ConnectionController {

    @Autowired
    private ConnectionServiceImp connectionService;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

    @Autowired
    private EnhancementServiceImp enhancementService;

    @Autowired
    private EnhancementNodeServiceImp enhancementNodeService;

    @Autowired
    private LinkRelationServiceImp linkRelationService;

    @Autowired
    private ValidationContext validationContext;

    @GetMapping("/all")
    public ResponseEntity<?> getAll(){
        List<Connection> connections = connectionService.findAll();
        List<ConnectionResource> connectionResources = connections.stream()
                .map(c -> connectionService.toNodeResource(c)).collect(Collectors.toList());
        return ResponseEntity.ok().body(connectionResources);
    }

    @GetMapping("/{connectionId}")
    public ResponseEntity<?> get(@PathVariable Long connectionId){
        Connection connection = connectionService.findById(connectionId).orElse(null);
        ConnectionResource connectionResource = connectionService.toNodeResource(connection);
        final Resource<ConnectionResource> resource = new Resource<>(connectionResource);
        return ResponseEntity.ok().body(resource);
    }

    @PostMapping
    public ResponseEntity<?> add(@RequestBody ConnectionResource connectionResource) throws Exception{
        Connection connection = connectionService.toEntity(connectionResource);
        if (connectionService.existsByName(connection.getName())){
            throw new RuntimeException("CONNECTION_NAME_ALREADY_EXISTS");
        }
        Long connectionId = 0L;
        try {
            connectionService.save(connection);
            connectionId = connection.getId();

            connectionResource.setConnectionId(connection.getId());
            ConnectionNode connectionNode = connectionNodeService.toEntity(connectionResource);
            connectionNodeService.save(connectionNode);

            if (connectionResource.getFieldBinding() != null){
                if (connectionResource.getFieldBinding().isEmpty()){
                    final Resource<ConnectionResource> resource = new Resource<>(connectionService.toNodeResource(connection));
                    return ResponseEntity.ok().body(resource);
                }

                List<EnhancementNode> enhancementNodes =  connectionNodeService
                        .buildEnhancementNodes(connectionResource.getFieldBinding(), connection);
                enhancementNodeService.saveAll(enhancementNodes);

                List<LinkRelation> linkRelations = linkRelationService
                        .toEntity(connectionResource.getFieldBinding(), connection);
                if (linkRelations != null && !linkRelations.isEmpty()){
                    linkRelationService.saveAll(linkRelations);
                }
            }

            final Resource<ConnectionResource> resource = new Resource<>(connectionService.toNodeResource(connection));
            validationContext.remove(connection.getName());
            return ResponseEntity.ok().body(resource);
        } catch (Exception e){
            enhancementService.deleteAllByConnectionId(connectionId);
            connectionService.deleteById(connectionId);
            connectionNodeService.deleteById(connectionId);

            ErrorMessageDataResource errorMessageDataResource =
                    new ErrorMessageDataResource(validationContext.get(connection.getName()));
            ValidationResource validationResource =
                    new ValidationResource(e, HttpStatus.BAD_REQUEST, "/connection", errorMessageDataResource);
            validationContext.remove(connection.getName());

            return ResponseEntity.badRequest().body(validationResource);
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody ConnectionResource connectionResource) throws Exception{
        Connection connection = connectionService.toEntity(connectionResource);
        if (connectionService.existsByName(connection.getName())){
            throw new RuntimeException("CONNECTION_NAME_ALREADY_EXISTS");
        }
        Long connectionId = 0L;
        try {
            connectionNodeService.toEntity(connectionResource);

            return ResponseEntity.ok().build();
        } catch (Exception e){
            ErrorMessageDataResource errorMessageDataResource =
                    new ErrorMessageDataResource(validationContext.get(connection.getName()));
            ValidationResource validationResource =
                    new ValidationResource(e, HttpStatus.BAD_REQUEST, "/connection", errorMessageDataResource);
            validationContext.remove(connection.getName());

            return ResponseEntity.badRequest().body(validationResource);
        }
    }

    @PutMapping("/{connectionId}")
    public ResponseEntity<?> update(@PathVariable Long connectionId,
                                    @RequestBody ConnectionResource connectionResource) throws Exception{
        connectionResource.setConnectionId(connectionId);
        Connection connection = connectionService.toEntity(connectionResource);
        enhancementService.deleteAllByConnectionId(connectionId);
        connectionService.save(connection);

        ConnectionNode connectionNode = connectionNodeService.toEntity(connectionResource);
        connectionNodeService.deleteById(connectionId);
        connectionNodeService.save(connectionNode);

        if (connectionResource.getFieldBinding() != null || !connectionResource.getFieldBinding().isEmpty()){
            List<EnhancementNode> enhancementNodes =  connectionNodeService
                    .buildEnhancementNodes(connectionResource.getFieldBinding(), connection);
            enhancementNodeService.saveAll(enhancementNodes);
        }
        final Resource<ConnectionResource> resource = new Resource<>(connectionService.toNodeResource(connection));
        return ResponseEntity.ok().body(resource);
    }

    @DeleteMapping("{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id){
        connectionService.deleteById(id);
        connectionNodeService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/check/{name}")
    public ResponseEntity<?> existsByName(@PathVariable("name") String name) throws IOException {
        if (connectionService.existsByName(name)){
            throw new ResponseStatusException(
                    HttpStatus.OK, "EXISTS");
        } else {
            throw new ResponseStatusException(HttpStatus.OK, "NOT_EXISTS");
        }
    }
}
