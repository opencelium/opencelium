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

import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.CommunicationFailedException;
import com.becon.opencelium.backend.exception.ConnectorAlreadyExistsException;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.invoker.entity.FunctionInvoker;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.invoker.service.InvokerServiceImp;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectionServiceImp;
import com.becon.opencelium.backend.database.mysql.service.ConnectorServiceImp;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@Tag(name = "Connector", description = "Manages operations related to Connector management")
@RequestMapping(value = "/api/connector", produces = "application/json")
public class ConnectorController {

    private final ConnectorService connectorService;
    private final InvokerService invokerService;
    private final ConnectionService connectionService;
    private final Mapper<Connector, ConnectorResource> connectorResourceMapper;

    public ConnectorController(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("invokerServiceImp")InvokerService invokerService,
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            Mapper<Connector, ConnectorResource> connectorResourceMapper
    ) {
        this.connectorService = connectorService;
        this.invokerService = invokerService;
        this.connectionService = connectionService;
        this.connectorResourceMapper = connectorResourceMapper;
    }

    @Operation(summary = "Retrieves a connector from database by provided connector ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connector has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = ConnectorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/{id}")
    public ResponseEntity<?> get(@PathVariable int id) {
        return connectorService.findById(id)
                .map(c -> ResponseEntity.ok().body(connectorResourceMapper.toDTO(c)))
                .orElseThrow(() -> new ConnectorNotFoundException(id));
    }

    @Operation(summary = "Retrieves all connectors from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connectors have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectorResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/all")
    public ResponseEntity<List<ConnectorResource>> getAll() {
        List<ConnectorResource> connectorResources = connectorResourceMapper.toDTOAll(connectorService.findAll());
        return ResponseEntity.ok(connectorResources);
    }

    @Operation(summary = "Creates new connector in the system by accepting Connector data in the request body")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connector has been successfully created",
                    content = @Content(schema = @Schema(implementation = ConnectorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> add(@RequestBody ConnectorResource connectorResource) {
        if (connectorService.existByTitle(connectorResource.getTitle())) {
            throw new ConnectorAlreadyExistsException("CONNECTOR_ALREADY_EXISTS");
        }

        Connector connector = connectorResourceMapper.toEntity(connectorResource);
        Connector saved = connectorService.save(connector);
        return ResponseEntity.ok().body(connectorResourceMapper.toDTO(saved));
    }

    @Operation(summary = "Modifies a connector in the system by providing connector ID and accepting Connector data in the request body")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connector has been successfully modified",
                    content = @Content(schema = @Schema(implementation = ConnectorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> update(@PathVariable int id, @RequestBody ConnectorResource connectorResource) {

        if (!connectorService.existById(id)) {
            throw new ConnectorNotFoundException(id);
        }

        Connector connector = connectorService.findById(id).orElseThrow(() -> new ConnectorNotFoundException(id));

        if (connectorService.existByTitle(connectorResource.getTitle()) && !connector.getTitle().equals(connectorResource.getTitle())) {
            throw new ConnectorAlreadyExistsException(connectorResource.getTitle());
        }
        connectorResource.setConnectorId(id);
        Connector entity = connectorResourceMapper.toEntity(connectorResource);
        connectorService.save(entity);

        return ResponseEntity.ok().body(connectorResourceMapper.toDTO(entity));
    }

    @Operation(summary = "Deletes a connector in the system by providing connector ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Connector has been successfully deleted",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping(path = "/{id}")
    public ResponseEntity<?> delete(@PathVariable int id) {
        List<Connection> connections = connectionService.findAllByConnectorId(id);
        connections.forEach(c -> {
            connectionService.deleteById(c.getId());
//            connectionNodeService.deleteById(c.getId());
        });
        connectorService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes a collection of connector based on the provided list of their corresponding IDs.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Connectors have been successfully deleted",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "list/delete", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteCtorByIdIn(@RequestBody IdentifiersDTO<Integer> ids) {
        ids.getIdentifiers().forEach(id -> {
            List<Connection> connections = connectionService.findAllByConnectorId(id);
            connections.forEach(c -> {
                connectionService.deleteById(c.getId());
//                connectionNodeService.deleteById(c.getId());
            });
            connectorService.deleteById(id);
        });
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Checks connection to a remote application where credential are set in connector")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully established to a remote connector"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/check", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> checkCommunication(@RequestBody ConnectorResource connectorResource) throws JsonProcessingException, IOException {
        Connector connector = connectorResourceMapper.toEntity(connectorResource);
//        Invoker invoker = invokerService.findByName(connector.getInvoker());
//        AuthFactory authFactory = new AuthFactory();
//        ApiAuth authenticationType = authFactory.generateAuth(invoker);
//        authenticationType.getAccessCredentials(connector);
        ResponseEntity<?> responseEntity;
        try {
            responseEntity = connectorService.checkCommunication(connector);
        } catch (Exception ex) {
            ex.printStackTrace();
            throw new CommunicationFailedException();
        }

        ObjectMapper mapper = new ObjectMapper();
        FunctionInvoker functionInvoker = invokerService.getTestFunction(connector.getInvoker());

        Map<String, Object> failBody = null;
        String formatType = "";
        String type = "";
        if (functionInvoker.getResponse().getFail() != null && functionInvoker.getResponse().getFail().getBody() != null) {
            formatType = functionInvoker.getResponse().getFail().getBody().getFormat();
            failBody = functionInvoker.getResponse().getFail().getBody().getFields();
        }

        Map<String, Object> response = new HashMap<>();
        if (formatType.equals("json")) {
            response = mapper.readValue(responseEntity.getBody().toString(), Map.class);
        }

        if ((responseEntity.getStatusCode() == HttpStatus.OK) && hasError(failBody, response)) {
            return ResponseEntity.ok().body("{\"status\":\"401\", \"error\":\"401\"}");
        }

        if (responseEntity.getStatusCode() == HttpStatus.UNAUTHORIZED) {
            return ResponseEntity.ok().body("{\"status\":\"" + responseEntity.getStatusCode() + "\",\"error\":\"Error in remote system\"}");
        }
        return ResponseEntity.ok().body("{\"status\":\"200\"}");
    }

    private boolean hasError(Map<String, Object> failBody, Map<String, Object> response) {

        if (failBody == null) {
            return false;
        }

        for (Map.Entry<String, Object> failEntry : failBody.entrySet()) {
            if (!response.containsKey(failEntry.getKey())) {
                return false;
            }

            if (failEntry.getValue() instanceof Map) {
                if (!hasError((Map<String, Object>) failEntry.getValue(), (Map<String, Object>) response.get(failEntry.getKey()))) {
                    return false;
                }
            }
        }
        return true;
    }

    @Operation(summary = "Verifies uniqueness of connector title")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Returns EXISTS or NOT_EXISTS",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/exists/{title}")
    public ResponseEntity<?> titleExists(@PathVariable("title") String title) throws IOException {
        if (connectorService.existByTitle(title)) {
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
