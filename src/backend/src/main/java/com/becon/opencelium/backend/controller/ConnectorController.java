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

import com.becon.opencelium.backend.authentication.AuthenticationType;
import com.becon.opencelium.backend.exception.CommunicationFailedException;
import com.becon.opencelium.backend.exception.ConnectorAlreadyExistsException;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.factory.AuthenticationFactory;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.entity.RequestData;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.connector.InvokerResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Resources;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/connector", produces = "application/hal+json", consumes = {"application/json"})
public class ConnectorController {

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private InvokerServiceImp invokerService;

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable int id){
        return connectorService.findById(id)
                .map(c -> ResponseEntity.ok().body(connectorService.toResource(c)))
                .orElseThrow(() -> new ConnectorNotFoundException(id));
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(){
        List<ConnectorResource> connectorResources = connectorService.findAll()
                .stream().map(c -> connectorService.toResource(c))
                .collect(Collectors.toList());

        final Resources<ConnectorResource> resources = new Resources<>(connectorResources);
        return ResponseEntity.ok(resources);
    }
    @PostMapping
    public ResponseEntity<?> add(@RequestBody ConnectorResource connectorResource){
        if (connectorService.existByTitle(connectorResource.getTitle())){
            throw new ConnectorAlreadyExistsException("CONNECTOR_ALREADY_EXISTS");
        }

        Connector connector = connectorService.toEntity(connectorResource);
        connectorService.save(connector);
        return ResponseEntity.ok().body(connectorService.toResource(connector));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody ConnectorResource connectorResource){

        if (!connectorService.existById(id)){
            throw new ConnectorNotFoundException(id);
        }

        Connector connector = connectorService.findById(id).orElseThrow(() -> new ConnectorNotFoundException(id));

        if (connectorService.existByTitle(connectorResource.getTitle()) && !connector.getTitle().equals(connectorResource.getTitle())){
            throw new ConnectorAlreadyExistsException(connectorResource.getTitle());
        }
        connectorResource.setConnectorId(id);
        Connector entity = connectorService.toEntity(connectorResource);
        connectorService.save(entity);

        return ResponseEntity.ok().body(connectorService.toResource(connector));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id){
        connectorService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkCommunication(@RequestBody ConnectorResource connectorResource) throws JsonProcessingException {
        Connector connector = connectorService.toEntity(connectorResource);
        Invoker invoker = invokerService.findByName(connector.getInvoker());
        AuthenticationFactory authFactory = new AuthenticationFactory(invokerService.findAll(), restTemplate);
        AuthenticationType authenticationType = authFactory.getAuthType(invoker.getAuthType());
        authenticationType.getAccessCredentials(connector);
        ResponseEntity<?> responseEntity;
        try {
            responseEntity = connectorService.checkCommunication(connector);
        }catch (Exception ex){
            ex.printStackTrace();
            throw new CommunicationFailedException();
        }

        if ((responseEntity.getStatusCode() == HttpStatus.OK) && (responseEntity.getBody().toString().contains("Error") ||
                                                                  responseEntity.getBody().toString().contains("error"))){
            return ResponseEntity.ok().body("{\"status\":\"401\", \"error\":\"401\"}");
        }

        if (responseEntity.getStatusCode() == HttpStatus.UNAUTHORIZED){
            return ResponseEntity.ok().body("{\"status\":\"" + responseEntity.getStatusCode() + "\",\"error\":\"Error in remote system\"}");
        }
        return ResponseEntity.ok().body("{\"status\":\"200\"}");
    }


}
