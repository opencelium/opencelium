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

import com.becon.opencelium.backend.commons.FileDescriptor;
import com.becon.opencelium.backend.configuration.cutomizer.RestCustomizer;
import com.becon.opencelium.backend.constant.AppYamlPath;
import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.service.ConnectionService;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.database.mysql.service.SchedulerService;
import com.becon.opencelium.backend.exception.ConcurrentTestIsForbidden;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.execution.socket.Connection2WebSocketChannelMapping;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.ApiDataResource;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.application.ResultDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectionResource;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.resource.connection.masking.RuleDTO;
import com.becon.opencelium.backend.resource.connection.old.ConnectionOldDTO;
import com.becon.opencelium.backend.resource.error.ErrorResource;
import com.becon.opencelium.backend.resource.request.SchedulerRequestResource;
import com.becon.opencelium.backend.resource.schedule.SchedulerResource;
import com.becon.opencelium.backend.resource.webhook.WebhookParamDTO;
import com.becon.opencelium.backend.utility.LogFileUtility;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.MvcUriComponentsBuilder;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = "/connection", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Connection", description = "Manages operations related to Connection management")
public class ConnectionController {

    private final Environment environment;
    private final ConnectionService connectionService;
    private final ConnectorService connectorService;
    private final ConnectionMngService connectionMngService;
    private final SchedulerService schedulerService;
    private final Connection2WebSocketChannelMapping connection2ChannelMapping;
    private final Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;
    private final Mapper<Connection, ConnectionResource> connectionResourceMapper;
    private final Mapper<ConnectionDTO, ConnectionOldDTO> connectionOldDTOMapper;
    private final PatchHelper patchHelper;

    public ConnectionController(
            Environment environment,
            SchedulerService schedulerService,
            ConnectorService connectorService,
            Connection2WebSocketChannelMapping connection2ChannelMapping,
            Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            Mapper<Connection, ConnectionResource> connectionResourceMapper,
            Mapper<ConnectionDTO, ConnectionOldDTO> connectionOldDTOMapper,
            @Qualifier("connectionServiceImp") ConnectionService connectionService,
            @Qualifier("connectionMngServiceImp") ConnectionMngService connectionMngService,
            PatchHelper patchHelper
    ) {
        this.environment = environment;
        this.schedulerService = schedulerService;
        this.connection2ChannelMapping = connection2ChannelMapping;
        this.connectionService = connectionService;
        this.connectorService = connectorService;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMapper = connectionMapper;
        this.connectionMngService = connectionMngService;
        this.connectionResourceMapper = connectionResourceMapper;
        this.connectionOldDTOMapper = connectionOldDTOMapper;
        this.patchHelper = patchHelper;
    }

    @Operation(summary = "Retrieves all connections from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connections have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionOldDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/all")
    public ResponseEntity<?> getAll() {
        List<ConnectionDTO> all = connectionService.getAllFullConnection();
        return ResponseEntity.ok(connectionOldDTOMapper.toDTOAll(all));
    }

    @Operation(summary = "Retrieves all connections from database by invokerName")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connections have been successfully retrieved by invokerName",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionOldDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/dependency/{invokerName}")
    public ResponseEntity<?> getByInvokerName(@PathVariable String invokerName) {
        List<Integer> connectorIds = connectorService.findAllByInvoker(invokerName).stream().map(Connector::getId).toList();

        List<ConnectionDTO> connections = new ArrayList<>();
        Set<Long> connectionIds = new HashSet<>();

        for (Integer connectorId : connectorIds) {
            List<Connection> connectionsByConnectorId = connectionService.findAllByConnectorId(connectorId);

            for (Connection connection : connectionsByConnectorId) {
                if (connectionIds.add(connection.getId())) {
                    connections.add(connectionService.getFullConnection(connection.getId()));
                }
            }
        }

        List<ConnectionOldDTO> result = connections.stream()
                .map(connectionOldDTOMapper::toDTO)
                .toList();
        return ResponseEntity.ok(result);
    }

    @Operation(summary = "Retrieves all Metadata of connections from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Metadata of connections have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/all/meta")
    public ResponseEntity<?> getAllMeta() {
        List<Connection> connections = connectionService.findAll();
        List<ConnectionResource> connectionResources = connectionResourceMapper.toDTOAll(connections);
        //unnecessary fields
        connectionResources.forEach(c -> {
            c.getFromConnector().setRequestData(null);
            c.getFromConnector().getInvoker().setOperations(null);
            c.getFromConnector().getInvoker().setRequiredData(null);

            c.getToConnector().setRequestData(null);
            c.getToConnector().getInvoker().setOperations(null);
            c.getToConnector().getInvoker().setRequiredData(null);
        });
        return ResponseEntity.ok(connectionResources);
    }

    @Operation(summary = "Retrieves all connections by IDs")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connections have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/all/by-ids")
    public ResponseEntity<?> getAllMeta(@RequestBody IdentifiersDTO<Long> ids) {
        List<Connection> connections = connectionService.findAllByIds(ids);
        List<ConnectionResource> connectionResources = connectionResourceMapper.toDTOAll(connections);
        //unnecessary fields
        connectionResources.forEach(c -> {
            c.getFromConnector().setRequestData(null);
            c.getFromConnector().getInvoker().setOperations(null);
            c.getFromConnector().getInvoker().setRequiredData(null);

            c.getToConnector().setRequestData(null);
            c.getToConnector().getInvoker().setOperations(null);
            c.getToConnector().getInvoker().setRequiredData(null);
        });
        return ResponseEntity.ok(connectionResources);
    }

    @Operation(summary = "Retrieves a connection from database by provided connection ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully retrieved",
                    content = @Content(schema = @Schema(implementation = ConnectionOldDTO.class))),
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
        return ResponseEntity.ok(connectionOldDTOMapper.toDTO(connectionDTO));
    }

    @Operation(summary = "Creates a connection from database by accepting connection data in request body.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully created",
                    content = @Content(schema = @Schema(implementation = ConnectionOldDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> save(@RequestBody ConnectionOldDTO connectionOldDTO) throws Exception {
        ConnectionDTO connectionDTO = connectionOldDTOMapper.toEntity(connectionOldDTO);
        Connection connection = connectionMapper.toEntity(connectionDTO);
        ConnectionMng connectionMng = connectionMngMapper.toEntity(connectionDTO);
        ConnectionMng savedConnection = connectionService.save(connection, connectionMng);
        ConnectionDTO dto = connectionService.getFullConnection(savedConnection.getConnectionId());

        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();
        return ResponseEntity.created(uri).body(connectionOldDTOMapper.toDTO(dto));
    }

    @Operation(summary = "Modifies a connection by provided connection ID and accepting connection data in request body.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection has been successfully modified",
                    content = @Content(schema = @Schema(implementation = ConnectionOldDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/{connectionId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> update(@PathVariable Long connectionId, @RequestBody ConnectionOldDTO connectionOldDTO) throws Exception {
        ConnectionDTO connectionDTO = connectionOldDTOMapper.toEntity(connectionOldDTO);
        Connection connection = connectionMapper.toEntity(connectionDTO);
        ConnectionMng connectionMng = connectionMngMapper.toEntity(connectionDTO);
        connection.setId(connectionId);

        connectionService.update(connection, connectionMng);
        return ResponseEntity.ok(connectionOldDTOMapper.toDTO(connectionService.getFullConnection(connectionId)));
    }

    @Operation(summary = "Tests connection execution by temporarily creating new connection and scheduler.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Connection execution has been successfully tested",
                    content = @Content(schema = @Schema(implementation = ConnectionOldDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/execution/test", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> test(@RequestBody ConnectionOldDTO connectionOldDTO, @RequestParam String channelId) throws Exception {
        // check if there is no running job for given connection
        schedulerService.getAllRunningJobs().forEach(job -> {
            String schedulerTitle = job.getTitle();
            if (schedulerTitle.startsWith("!*test_schedule_") && schedulerTitle.endsWith(connectionOldDTO.getTitle())) {
                throw new ConcurrentTestIsForbidden(0L);
            }
        });

        // create temporary connection, will be deleted after execution finished
        String postfix = System.currentTimeMillis() + "_" + connectionOldDTO.getTitle();
        connectionOldDTO.setTitle("!*test_connection_" + postfix);
        ConnectionDTO connectionDTO = connectionOldDTOMapper.toEntity(connectionOldDTO);
        Connection connection = connectionMapper.toEntity(connectionDTO);
        ConnectionMng connectionMng = connectionMngMapper.toEntity(connectionDTO);
        ConnectionMng savedConnection = connectionService.save(connection, connectionMng);
        Long connectionId = savedConnection.getConnectionId();

        // create temporary scheduler for above connection, will be deleted after execution finished
        SchedulerRequestResource resource = new SchedulerRequestResource();
        resource.setConnectionId(connectionId);
        resource.setTitle("!*test_schedule_" + postfix);
        resource.setStatus(true);
        resource.setCronExp(Constant.NEVER_TRIGGERED_CRON);
        resource.setDebugMode(true);

        Scheduler scheduler = schedulerService.toEntity(resource);
        schedulerService.save(scheduler);

        connection2ChannelMapping.add(connectionId, channelId);

        schedulerService.startNow(scheduler, channelId);

        // return schedulerId
        SchedulerResource schedulerResource = new SchedulerResource();
        schedulerResource.setSchedulerId(scheduler.getId());
        return ResponseEntity.ok(schedulerResource);
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
        return ResponseEntity.noContent().build();
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
    @GetMapping("/id")
    public ResponseEntity<?> getNewConnectionId() {
        Long id = connectionService.createEmptyConnection();
        JSONObject jsonObject = new JSONObject();
        jsonObject.put("id", id);

        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();
        return ResponseEntity.created(uri).body(jsonObject);
    }

    @Operation(summary = "Updates connection with a patch request")
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
        PatchConnectionDetails details = patchHelper.describe(patch);
        connectionService.patchUpdate(connectionId, patch, details);
        ConnectionDTO connectionDTO = connectionService.getFullConnection(connectionId);
        JSONObject jsonObject = new JSONObject();

        for (PatchConnectionDetails.PatchOperationDetail opDetail : details.getOpDetails()) {
            if (opDetail.isMethodAdded()) {
                List<MethodDTO> methods;
                if (opDetail.isFrom()) {
                    methods = connectionDTO.getFromConnector().getMethods();
                } else {
                    methods = connectionDTO.getToConnector().getMethods();
                }
                String id = methods.get(patchHelper.getIndexOfList(opDetail.getIndexOfMethod(), methods.size())).getId();
                jsonObject.put("id", id);
                return ResponseEntity.ok(jsonObject);
            } else if (opDetail.isOperatorAdded()) {
                List<OperatorDTO> operators;
                if (opDetail.isFrom()) {
                    operators = connectionDTO.getFromConnector().getOperators();
                } else {
                    operators = connectionDTO.getToConnector().getOperators();
                }
                String id = operators.get(patchHelper.getIndexOfList(opDetail.getIndexOfOperator(), operators.size())).getId();
                jsonObject.put("id", id);
                return ResponseEntity.ok(jsonObject);
            } else if (opDetail.isEnhancementAdded()) {
                List<FieldBindingDTO> fieldBindings = connectionDTO.getFieldBinding();
                String id = fieldBindings.get(patchHelper.getIndexOfList(opDetail.getIndexOfEnhancement(), fieldBindings.size())).getId();
                jsonObject.put("id", id);
                return ResponseEntity.ok(jsonObject);
            }
        }
        return ResponseEntity.ok().build();
    }


    @Operation(summary = "Add|delete|updates a method and|or an operator of connection with a patch request and returns current its id")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Method and|or Operator has been successfully updated"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PatchMapping(
            path = {"/{connectionId}/connector/{connectorId}"},
            consumes = "application/json-patch+json"
    )
    public ResponseEntity<?> patchMethodOrOperator(
            @PathVariable Long connectionId,
            @PathVariable Integer connectorId,
            @RequestBody JsonPatch patch
    ) {
        if (connectorId == null || connectorId == 0) {
            throw new ConnectorNotFoundException(0);
        }

        Connection connection = connectionService.getById(connectionId);

        JsonPatch changed;
        if (connection.getFromConnector() == connectorId) {
            changed = patchHelper.changeEachPath(patch, p -> "/fromConnector" + p);
        } else {
            changed = patchHelper.changeEachPath(patch, p -> "/toConnector" + p);
        }
        return patchUpdate(connectionId, changed);
    }

    @Operation(summary = "Updates a fieldBinding of connection with a patch request")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "FieldBinding has been successfully updated"),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PatchMapping(
            path = {"/{connectionId}/fieldBinding/{id}"},
            consumes = "application/json-patch+json"
    )
    public ResponseEntity<?> patchEnhancement(
            @PathVariable Long connectionId,
            @PathVariable String id,
            @RequestBody JsonPatch patch
    ) {
        if (id == null) {
            throw new RuntimeException("ENHANCEMENT_NOT_FOUND");
        }
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(connectionId);
        if (connectionMng.getFieldBindings() == null) {
            throw new RuntimeException("ENHANCEMENT_NOT_FOUND");
        }
        int index = -1;
        for (int i = 0; i < connectionMng.getFieldBindings().size(); i++) {
            if (connectionMng.getFieldBindings().get(i).getId().equals(id)) {
                index = i;
                break;
            }
        }
        if (index == -1) {
            throw new RuntimeException("ENHANCEMENT_NOT_FOUND");
        } else {
            String pre = "/fieldBinding/" + index;
            JsonPatch changed = patchHelper.changeEachPath(patch, p -> pre + p);
            return patchUpdate(connectionId, changed);
        }
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
    public ResponseEntity<?> sendRequestToApi(@RequestBody ApiDataResource apiDataResource) {
        HttpHeaders headers = new HttpHeaders();
        if (apiDataResource.getHeader() != null) {
            headers.setAll(apiDataResource.getHeader());
        }

        HttpEntity<Object> requestEntity = new HttpEntity<>(apiDataResource.getBody(), headers);

        String proxyHost = environment.getProperty(AppYamlPath.PROXY_HOST, "");
        String proxyPort = environment.getProperty(AppYamlPath.PROXY_PORT, "");
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
    public ResponseEntity<?> deleteCtionByIdIn(@RequestBody IdentifiersDTO<Long> ids) {
        ids.getIdentifiers().forEach(connectionService::deleteById);
        return ResponseEntity.noContent().build();
    }


    @Operation(summary = "Removes webhook")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Webhook has been successfully deleted",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping("/{connectionId}/webhook/vars")
    public ResponseEntity<?> getVariablesFromConnection(@PathVariable long connectionId) {
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(connectionId);
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            // Convert the Java object to a JSON string
            String json = objectMapper.writeValueAsString(connectionMng);
            List<WebhookParamDTO> webhookParams = connectionService.extractVarsFromJson(json);
            return ResponseEntity.ok(webhookParams);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Operation(summary = "Retrieves all masking rules of connection from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "All rules of a connection have been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionOldDTO.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/{connectionId}/rule/all")
    public ResponseEntity<List<RuleDTO>> getAllRules(@PathVariable long connectionId) {
        List<RuleDTO> rules = connectionService.getAllRules(connectionId).stream()
                .map(RuleDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(rules);
    }


    @Operation(summary = "Retrieves specified masking rule of connection from database")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Specified rule of a connection has been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/{connectionId}/rule/{ruleId}")
    public ResponseEntity<RuleDTO> getOneRule(@PathVariable long connectionId, @PathVariable long ruleId) {
        return ResponseEntity.ok(connectionService.getOneRule(connectionId, ruleId));
    }

    @Operation(summary = "Creates set of masking rules for a connection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201",
                    description = "Masking rules for a connection have been created successfully",
                    content = @Content(schema = @Schema(implementation = ConnectionOldDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/{connectionId}/rule/list", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<RuleDTO>> saveRuleList(@PathVariable long connectionId, @RequestBody List<RuleDTO> dtos) {
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();

        return ResponseEntity.created(uri).body(connectionService.saveRuleList(connectionId, dtos));
    }

    @Operation(summary = "Creates a masking rule for a connection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201",
                    description = "Masking rule for a connection has been created successfully",
                    content = @Content(schema = @Schema(implementation = ConnectionOldDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/{connectionId}/rule", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RuleDTO> saveRule(@PathVariable long connectionId, @RequestBody RuleDTO dto) {
        final URI uri = MvcUriComponentsBuilder
                .fromController(getClass())
                .buildAndExpand().toUri();

        return ResponseEntity.created(uri).body(connectionService.saveRule(connectionId, dto));
    }

    @Operation(summary = "Updates masking rule for a connection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Masking rule for a connection has been updated successfully",
                    content = @Content(schema = @Schema(implementation = ConnectionOldDTO.class))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PutMapping(path = "/{connectionId}/rule/{ruleId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateRule(@PathVariable long connectionId, @PathVariable long ruleId, @RequestBody RuleDTO dto) {
        return ResponseEntity.ok(connectionService.updateRule(connectionId, ruleId, dto));
    }

    @Operation(summary = "Deletes masking rules of a connection by provided connection ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Masking rules of a connection have been deleted successfully.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping(path = "/{connectionId}/rule/all")
    public ResponseEntity<?> deleteRuleList(@PathVariable long connectionId) {
        connectionService.deleteRuleList(connectionId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Deletes a masking rule of a connection by provided connection ID and rule ID")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204",
                    description = "Masking rule of a connection has been deleted successfully.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @DeleteMapping(path = "/{connectionId}/rule/{ruleId}")
    public ResponseEntity<?> deleteRule(@PathVariable long connectionId, @PathVariable long ruleId) {
        connectionService.deleteRule(connectionId, ruleId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Create support file with given masking for connection execution")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Process started successfully.",
                    content = @Content),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @PostMapping(path = "/execute/{connectionId}/support-file")
    public ResponseEntity<?> executeWithSupportFile(@PathVariable long connectionId, @RequestBody List<RuleDTO> ruleDTOs) {
        // check if connection is being executed currently
        schedulerService.throwIfConnectionIsBeingExecuted(connectionId);

        // create temporary scheduler, will be deleted after execution finished
        SchedulerRequestResource resource = new SchedulerRequestResource();
        resource.setConnectionId(connectionId);
        resource.setTitle(connectionId + "_" + UUID.randomUUID());
        resource.setStatus(true);
        resource.setCronExp(Constant.NEVER_TRIGGERED_CRON);
        resource.setDebugMode(true);

        Scheduler scheduler = schedulerService.toEntity(resource);
        schedulerService.save(scheduler);

        // map rule dtos
        List<MaskingRule> rules = ruleDTOs.stream().map(dto -> {
            MaskingRule rule = new MaskingRule();
            rule.setType(dto.getType());
            rule.setExpression(dto.getExpression());

            return rule;
        }).toList();

        schedulerService.startNow(scheduler, rules);

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Retrieves list of log names for connection")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200",
                    description = "Log names for a connection has been successfully retrieved",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = ConnectionResource.class)))),
            @ApiResponse(responseCode = "401",
                    description = "Unauthorized",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
            @ApiResponse(responseCode = "500",
                    description = "Internal Error",
                    content = @Content(schema = @Schema(implementation = ErrorResource.class))),
    })
    @GetMapping(path = "/{connectionId}/log-files")
    public ResponseEntity<ResultDTO<List<String>>> getLogFileNameList(@PathVariable long connectionId) {
        ResultDTO<List<String>> logFileNames = new ResultDTO<>(connectionService.getLogFileNameListById(connectionId));
        return ResponseEntity.ok(logFileNames);
    }
}
