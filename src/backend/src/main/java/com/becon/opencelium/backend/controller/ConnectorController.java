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

import com.becon.opencelium.backend.exception.CommunicationFailedException;
import com.becon.opencelium.backend.exception.ConnectorAlreadyExistsException;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.entity.Invoker;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.mysql.entity.Connection;
import com.becon.opencelium.backend.mysql.entity.Connector;
import com.becon.opencelium.backend.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.neo4j.service.ConnectionNodeServiceImp;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.CollectionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/api/connector", produces = "application/hal+json", consumes = {"application/json"})
public class ConnectorController {

    @Autowired
    private ConnectorServiceImp connectorService;

    @Autowired
    private InvokerServiceImp invokerService;

    @Autowired
    private ConnectionServiceImp connectionService;

    @Autowired
    private ConnectionNodeServiceImp connectionNodeService;

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

        final CollectionModel<ConnectorResource> resources = CollectionModel.of(connectorResources);
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

        return ResponseEntity.ok().body(connectorService.toResource(entity));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable int id){
        List<Connection> connections = connectionService.findAllByConnectorId(id);
        connections.forEach(c -> {
            connectionService.deleteById(c.getId());
            connectionNodeService.deleteById(c.getId());
        });
        connectorService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<?> deleteCtorByIdIn(@RequestBody List<Integer> ids){
        ids.forEach(id -> {
            List<Connection> connections = connectionService.findAllByConnectorId(id);
            connections.forEach(c -> {
                connectionService.deleteById(c.getId());
                connectionNodeService.deleteById(c.getId());
            });
            connectorService.deleteById(id);
        });
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkCommunication(@RequestBody ConnectorResource connectorResource) throws JsonProcessingException, IOException {
        Connector connector = connectorService.toEntity(connectorResource);
        Invoker invoker = invokerService.findByName(connector.getInvoker());
//        AuthFactory authFactory = new AuthFactory();
//        ApiAuth authenticationType = authFactory.generateAuth(invoker);
//        authenticationType.getAccessCredentials(connector);
        ResponseEntity<?> responseEntity;
        try {
            responseEntity = connectorService.checkCommunication(connector);
        } catch (Exception ex){
            ex.printStackTrace();
            throw new CommunicationFailedException();
        }

        ObjectMapper mapper = new ObjectMapper();
        FunctionInvoker functionInvoker =  invokerService.getTestFunction(connector.getInvoker());

        Map<String, Object> failBody = null;
        String formatType = "";
        String type = "";
        if (functionInvoker.getResponse().getFail().getBody() != null) {
            formatType = functionInvoker.getResponse().getFail().getBody().getFormat();
            failBody = functionInvoker.getResponse().getFail().getBody().getFields();
        }

        Map<String, Object> response = new HashMap<>();
        if (formatType.equals("json")) {
            response = mapper.readValue(responseEntity.getBody().toString(), Map.class);
        }

        if ((responseEntity.getStatusCode() == HttpStatus.OK) && hasError(failBody, response)){
            return ResponseEntity.ok().body("{\"status\":\"401\", \"error\":\"401\"}");
        }

        if (responseEntity.getStatusCode() == HttpStatus.UNAUTHORIZED){
            return ResponseEntity.ok().body("{\"status\":\"" + responseEntity.getStatusCode() + "\",\"error\":\"Error in remote system\"}");
        }
        return ResponseEntity.ok().body("{\"status\":\"200\"}");
    }

    private boolean hasError(Map<String, Object> failBody, Map<String, Object> response) {

        if (failBody == null) {
            return false;
        }

        for (Map.Entry<String, Object> failEntry : failBody.entrySet()) {
            if (!response.containsKey(failEntry.getKey())){
                return false;
            }

            if (failEntry.getValue() instanceof Map) {
                if(!hasError((Map<String, Object>) failEntry.getValue(),(Map<String, Object>) response.get(failEntry.getKey()))){
                    return false;
                }
            }
        }
        return true;
    }

    @GetMapping("/exists/{title}")
    public ResponseEntity<?> titleExists(@PathVariable("title") String title) throws IOException{
        if (connectorService.existByTitle(title)){
            throw new ResponseStatusException(HttpStatus.OK, "EXISTS");
        } else {
            throw new ResponseStatusException(HttpStatus.OK, "NOT_EXISTS");
        }
    }


//    @GetMapping("/file/{filename:.+}")
//    @ResponseBody
//    public ResponseEntity<org.springframework.core.io.Resource> download(@PathVariable String filename) {
//
//        try {
//            Path rootLocation = Paths.get(PathConstant.ICONS);
//            Path filePath = rootLocation.resolve(filename);
//            org.springframework.core.io.Resource file = new UrlResource(filePath.toUri());
//            if (!file.exists() || !file.isReadable()) {
//                throw new StorageFileNotFoundException("Could not read file: " + filename);
//            }
//            return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,
//                    "attachment; filename=\"" + file.getFilename() + "\"").body(file);
//        }
//        catch (MalformedURLException e) {
//            throw new StorageFileNotFoundException("Could not read file: " + filename, e);
//        }
//    }

}
