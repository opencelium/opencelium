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

import com.becon.opencelium.backend.commons.ThreadLocalSingleton;
import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.constant.HeaderConstants;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.CommunicationFailedException;
import com.becon.opencelium.backend.exception.ConnectorAlreadyExistsException;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorHealthService;
import com.becon.opencelium.backend.enums.ConnectorStatus;
import com.becon.opencelium.backend.mapper.mysql.ConnectorResourceMapper;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorMetaDTO;
import com.becon.opencelium.backend.resource.connector.ConnectorResource;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.fasterxml.jackson.core.JsonProcessingException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
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
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.*;

@RestController
@Tag(name = "Connector", description = "Manages operations related to Connector management")
@RequestMapping(value = "/connector", produces = "application/json")
public class ConnectorController {

    private final ConnectorService connectorService;
    private final ConnectorHealthService connectorHealthService;
    private final ConnectionService connectionService;
    private final ConnectorResourceMapper connectorResourceMapper;

    public ConnectorController(
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            ConnectorHealthService connectorHealthService,
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            ConnectorResourceMapper connectorResourceMapper
    ) {
        this.connectorService = connectorService;
        this.connectorHealthService = connectorHealthService;
        this.connectionService = connectionService;
        this.connectorResourceMapper = connectorResourceMapper;
    }

    @Operation(summary = "Retrieves a connector from database by provided connector Title",
        parameters = {
            @Parameter(
                name = "X-Master-Password",
                in = ParameterIn.HEADER,
                description = "Enables secure resolution of protected connection credentials (such as remote API URL," +
                        " authentication tokens, usernames, or passwords) required to execute the request.\n" +
                        "If omitted, sensitive connection properties remain masked and are not used."
            )
    })
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
    @GetMapping
    public ResponseEntity<?> getByTitle(@RequestParam String title) {
        return connectorService.findAllByTitle(title)
                .map(c -> ResponseEntity.ok().body(connectorResourceMapper.toDTO(c)))
                .orElseThrow(() -> new ConnectorNotFoundException(title));
    }

    @Operation(
        summary = "Retrieves a connector from database by provided connector ID",
        parameters = {
            @Parameter(
                    name = "X-Master-Password",
                    in = ParameterIn.HEADER,
                    description = "Enables secure resolution of protected connection credentials (such as remote API URL," +
                            " authentication tokens, usernames, or passwords) required to execute the request.\n" +
                            "If omitted, sensitive connection properties remain masked and are not used."
            )
    })
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

    @Operation(summary = "Retrieves all connectors from database",
        parameters = {
            @Parameter(
                name = "X-Master-Password",
                in = ParameterIn.HEADER,
                description = "Enables secure resolution of protected connection credentials (such as remote API URL," +
                        " authentication tokens, usernames, or passwords) required to execute the request.\n" +
                        "If omitted, sensitive connection properties remain masked and are not used."
            )
    })
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

    @Operation(summary = "Retrieves the credential-free health/status view of all connectors")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connector meta data has been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectorMetaDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/meta/all")
    public ResponseEntity<List<ConnectorMetaDTO>> getAllMeta() {
        // Raw read on purpose: the meta view carries no credentials, so decryption is skipped.
        return ResponseEntity.ok(connectorResourceMapper.toMetaDTOAll(connectorService.findAllRaw()));
    }

    @Operation(summary = "Runs an immediate health check of the connector and returns its current status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Current connector status; if a check is already in flight, the "
                            + "stored state is returned without triggering another one",
                    content = @Content(schema = @Schema(implementation = ConnectorMetaDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping("/{id}/status/refresh")
    public ResponseEntity<ConnectorMetaDTO> refreshStatus(@PathVariable int id) {
        // getById decrypts the request data the check needs and throws the usual
        // not-found exception for unknown ids.
        Connector connector = connectorService.getById(id);
        connectorHealthService.runCheck(connector);
        // Reload raw to reflect exactly what runCheck persisted.
        return ResponseEntity.ok(connectorResourceMapper.toMetaDTO(connectorService.getByIdRaw(id)));
    }

    @Operation(summary = "Retrieves all connectors with IDs")
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
    @PostMapping("/list/by-ids")
    public ResponseEntity<List<ConnectorResource>> getAllByIds(@RequestBody IdentifiersDTO<Integer> ids) {
        List<ConnectorResource> connectorResources = connectorResourceMapper.toDTOAll(connectorService.findByIds(ids));

        connectorResources.forEach(x -> {
            x.getInvoker().setOperations(null);
            x.getInvoker().setRequiredData(null);
        });

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
        connector.setId(0);
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
    public ResponseEntity<ConnectorResource> update(@PathVariable Integer id, @RequestBody ConnectorResource connectorResource) {
        return ResponseEntity.ok(
                connectorResourceMapper.toDTO(
                        connectorService.update(id, connectorResource)
                )
        );
    }

    @Operation(summary = "Uploads (or replaces) the icon of a connector by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connector icon has been successfully stored",
                    content = @Content(schema = @Schema(implementation = ConnectorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/{id}/icon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ConnectorResource> uploadIcon(@PathVariable int id,
                                                        @RequestParam("file") MultipartFile file) {
        Connector connector = connectorService.storeIcon(id, file);
        return ResponseEntity.ok(connectorResourceMapper.toDTO(connector));
    }

    @Operation(summary = "Deletes the icon of a connector by its ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Connector icon has been successfully deleted",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping(path = "/{id}/icon")
    public ResponseEntity<?> deleteIcon(@PathVariable int id) {
        connectorService.deleteIcon(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Modifies connector's required data")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Connector's required data has been successfully modified"),
    })
    @PutMapping(path = "/{id}/required-data")
    public ResponseEntity<ConnectorResource> updateRequiredData(
            @PathVariable Integer id,
            @RequestBody Map<String, String> requiredData,
            @RequestHeader(name = HeaderConstants.MASTER_PASSWORD, required = false) String masterPassword
    ) {
        connectorService.verifyMasterPassword(masterPassword);

        connectorService.updateRequestData(id, requiredData);

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Verifies Master Password")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully verified")
    })
    @GetMapping(path = "/master-password/status")
    public ResponseEntity<?> verifyMasterPassword(
            @RequestHeader(name = HeaderConstants.MASTER_PASSWORD, required = false) String masterPassword) {

        connectorService.verifyMasterPassword(masterPassword);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Checks existence of Master Password")
    @ApiResponses(value = {
            @ApiResponse(
                    responseCode = "200",
                    description = "Exists or Not Exists",
                    content = @Content(schema = @Schema(implementation = Boolean.class))
            )
    })
    @GetMapping(path = "/master-password/status/exist")
    public ResponseEntity<Boolean> checkMasterPasswordExist() {
        return ResponseEntity.ok(connectorService.existsMasterPassword());
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
                connectionService.deleteAndTrackIt(c.getId());
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
        ConnectorHealthService.CheckResult result = connectorHealthService.check(connector);

        // Persist the latest result only for a saved connector; an unsaved/new connector has no row.
        if (connectorResource.getConnectorId() > 0 && connectorService.existsById(connectorResource.getConnectorId())) {
            connectorService.updateStatus(connectorResource.getConnectorId(), result.status(), result.error());
        }

        if (result.status() == ConnectorStatus.DOWN) {
            // The remote request could not be completed (e.g. host unreachable).
            throw new CommunicationFailedException();
        }

        if ((result.httpStatus() == HttpStatus.OK) && result.status() != ConnectorStatus.UP) {
            return ResponseEntity.ok().body("{\"status\":\"401\", \"error\":\"401\"}");
        }

        if (result.httpStatus() == HttpStatus.UNAUTHORIZED) {
            return ResponseEntity.ok().body("{\"status\":\"" + result.httpStatus() + "\",\"error\":\"Error in remote system\"}");
        }
        return ResponseEntity.ok().body("{\"status\":\"200\"}");
    }

    @Operation(summary = "Verifies uniqueness of connector title")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Returns true or false in the result object",
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
        ResultDTO<Boolean> resultDTO = new ResultDTO<>();
        if (connectorService.existByTitle(title)) {
            resultDTO.setResult(true);
        } else {
            resultDTO.setResult(false);
        }

        return ResponseEntity.ok(resultDTO);
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
