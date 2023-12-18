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

import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.constant.YamlPropConst;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.ApiDataResource;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.github.fge.jsonpatch.JsonPatch;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import net.minidev.json.JSONObject;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.env.Environment;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(value = "/api/connection", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Connection", description = "Manages operations related to Connection management")
public class ConnectionController {

    private final Environment environment;
    private final ConnectionService connectionService;
    private final ConnectionMngService connectionMngService;
    private final Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;

    public ConnectionController(
            Environment environment,
            Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            @Qualifier("connectionMngServiceImp") ConnectionMngService connectionMngService
    ) {
        this.environment = environment;
        this.connectionService = connectionService;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMapper = connectionMapper;
        this.connectionMngService = connectionMngService;
    }

    @Operation(summary = "Retrieves all connections from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connections have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/all")
    public ResponseEntity<?> getAll() {
        List<ConnectionMng> connections = connectionMngService.getAll();
        return ResponseEntity.ok(connectionMngMapper.toDTOAll(connections));
    }


    @Operation(summary = "Retrieves all Metadata of connections from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Metadata of connections have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/all/meta")
    public ResponseEntity<?> getAllMeta() {
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Retrieves a connection from database by provided connection ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = ConnectionDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/{connectionId}")
    public ResponseEntity<?> get(@PathVariable Long connectionId) {
        ConnectionDTO connectionDTO = connectionService.getFullConnection(connectionId);
        return ResponseEntity.ok(connectionDTO);
    }

    @Operation(summary = "Creates an empty connection and returns it's id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully created",
                    content = @Content(schema = @Schema(implementation = ConnectionDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping
    public ResponseEntity<?> createEmptyConnection() {
        Long id = connectionService.createEmptyConnection();
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", id);

        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();
        return ResponseEntity.created(uri).body(jsonObject);
    }

    @Operation(summary = "Updates connection's basic fields with a patch request")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully updated"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PatchMapping(path = "/{connectionId}", consumes = "application/json-patch+json")
    public ResponseEntity<?> patchUpdate(@PathVariable Long connectionId, @RequestBody JsonPatch patch) {
        connectionService.update(connectionId, patch);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Add/delete/updates an operator of connection with a patch request and returns current operator's id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully updated",
                    content = @Content(schema = @Schema(implementation = OperatorDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PatchMapping(
            path = {
                    "/{connectionId}/connector/{connectorId}/operator/{operatorId}",
                    "/{connectionId}/connector/{connectorId}/operator"
            },
            consumes = "application/json-patch+json"
    )
    public ResponseEntity<?> patchOperator(
            @PathVariable Long connectionId,
            @PathVariable Integer connectorId,
            @PathVariable Optional<String> operatorId,
            @RequestBody JsonPatch patch
    ) {
        String id = connectionService.updateOperator(connectionId, connectorId, operatorId.orElse(null), patch);
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", id);
        return ResponseEntity.ok(jsonObject);
    }

    @Operation(summary = "Add/delete/updates a method of connection with a patch request and returns current method's id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully updated",
                    content = @Content(schema = @Schema(implementation = MethodDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PatchMapping(
            path = {
                    "/{connectionId}/connector/{connectorId}/method/{methodId}",
                    "/{connectionId}/connector/{connectorId}/method"
            },
            consumes = "application/json-patch+json"
    )
    public ResponseEntity<?> patchMethod(
            @PathVariable Long connectionId,
            @PathVariable Integer connectorId,
            @PathVariable Optional<String> methodId,
            @RequestBody JsonPatch patch
    ) {
        String id = connectionService.updateMethod(connectionId, connectorId, methodId.orElse(null), patch);
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", id);
        return ResponseEntity.ok(jsonObject);
    }

    @Operation(summary = "Add/delete/updates an enhancement of connection with a patch request and returns current enhancement's id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully updated",
                    content = @Content(schema = @Schema(implementation = FieldBindingDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PatchMapping(
            path = {
                    "/{connectionId}/fieldBinding",
                    "/{connectionId}/fieldBinding/{fieldBindingId}"
            },
            consumes = "application/json-patch+json"
    )
    public ResponseEntity<?> patchEnhancement(
            @PathVariable Long connectionId,
            @PathVariable Optional<String> fieldBindingId,
            @RequestBody JsonPatch patch
    ) {
        FieldBindingMng fB = connectionService.updateEnhancement(connectionId, fieldBindingId.orElse(""), patch);
        return ResponseEntity.ok(fB);
    }

    @Operation(summary = "Undoes the last update and returns undid connection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully undid",
                    content = @Content(schema = @Schema(implementation = ConnectionDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/{connectionId}/undo")
    public ResponseEntity<?> undo(@PathVariable Long connectionId) {
        connectionService.undo(connectionId);
        ConnectionDTO connectionDTO = connectionService.getFullConnection(connectionId);
        return ResponseEntity.ok(connectionDTO);
    }


    @Operation(summary = "Creates a connection from database by accepting connection data in request body.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully created",
                    content = @Content(schema = @Schema(implementation = ConnectionDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> save(@RequestBody ConnectionDTO connectionDTO) throws Exception {
        Connection connection = connectionMapper.toEntity(connectionDTO);
        ConnectionMng connectionMng = connectionMngMapper.toEntity(connectionDTO);
        ConnectionMng savedConnection = connectionService.save(connection, connectionMng);
        ConnectionDTO dto = connectionMngMapper.toDTO(savedConnection);

        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();
        return ResponseEntity.created(uri).body(dto);
    }

    @Operation(summary = "Modifies a connection by provided connection ID and accepting connection data in request body.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully modified",
                    content = @Content(schema = @Schema(implementation = ConnectionDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/{connectionId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> update(@PathVariable Long connectionId, @RequestBody ConnectionDTO connectionDTO) throws Exception {
        Connection connection = connectionMapper.toEntity(connectionDTO);
        ConnectionMng connectionMng = connectionMngMapper.toEntity(connectionDTO);
        connection.setId(connectionId);
        ConnectionMng updatedConnection = connectionService.update(connection, connectionMng);
        return ResponseEntity.ok(connectionMngMapper.toDTO(updatedConnection));
    }

    @Operation(summary = "Validates a connection for correctly constructed structure")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully validated"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/validate", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> validate(@RequestBody ConnectionDTO connectionDTO) throws Exception {
        return ResponseEntity.badRequest().build();
    }

    @Operation(summary = "Deletes a connection by provided connection ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Connection has been successfully deleted.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping(path = "/{id}")
    public ResponseEntity<?> delete(@PathVariable("id") Long id) {
        connectionService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Validates name of connection for uniqueness")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection Name has been successfully validate. Return EXISTS or NOT_EXISTS values in 'message' property.",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/check/{name}")
    public ResponseEntity<?> existsByName(@PathVariable("name") String name) throws IOException {
        RuntimeException ex;
        if (connectionService.existsByName(name)) {
            ex = new RuntimeException("EXISTS");
        } else {
            ex = new RuntimeException("NOT_EXISTS");
        }

        String uri = ServletUriComponentsBuilder.fromCurrentRequest().build().toUri().toString();
        ErrorResource errorResource = new ErrorResource(ex, HttpStatus.OK, uri);
        return ResponseEntity.ok().body(errorResource);
    }


    @Operation(summary = "Sends request to remote api by accepting api data in request body.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Returns json string. Structure of json could be different depending on api.",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/remoteapi", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> sendRequestToApi(@RequestBody ApiDataResource apiDataResource) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        if (apiDataResource.getHeader() != null) {
            headers.setAll(apiDataResource.getHeader());
        }

        HttpEntity<Object> requestEntity = new HttpEntity<>(apiDataResource.getBody(), headers);

        String proxyHost = environment.getProperty(YamlPropConst.PROXY_HOST, "");
        String proxyPort = environment.getProperty(YamlPropConst.PROXY_PORT, "");
        RestTemplateBuilder restTemplateBuilder =
                new RestTemplateBuilder(new RestCustomizer(proxyHost, proxyPort, apiDataResource.isSslOn()));
        RestTemplate restTemplate = restTemplateBuilder.build();

        ResponseEntity<String> responseEntity = restTemplate.exchange(
                apiDataResource.getUrl(),
                HttpMethod.valueOf(apiDataResource.getMethod()),
                requestEntity,
                String.class
        );

        return ResponseEntity.status(responseEntity.getStatusCode()).body(responseEntity.getBody());
    }

    @Operation(summary = "Deletes a list of connections based on the provided list of their corresponding IDs")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "List of connections have been deleted from database",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/list/delete")
    public ResponseEntity<?> deleteCtionByIdIn(@RequestBody IdentifiersDTO<Long> ids) throws Exception {

        ids.getIdentifiers().forEach(id -> {
            connectionService.deleteById(id);
//            connectionNodeService.deleteById(id);
        });
        return ResponseEntity.noContent().build();
    }
}
