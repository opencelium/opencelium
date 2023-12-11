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

package com.becon.opencelium.backend.database.mysql.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.*;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.container.ConnectionUpdateTracker;
import com.becon.opencelium.backend.container.Command;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.resource.connection.binding.FieldBindingDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.fge.jsonpatch.JsonPatch;
import com.mongodb.MongoException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

@Service
public class ConnectionServiceImp implements ConnectionService {
    private final ConnectionRepository connectionRepository;
    private final ConnectorService connectorService;
    private final ConnectionMngService connectionMngService;
    private final FieldBindingMngService fieldBindingMngService;
    private final SchedulerService schedulerService;
    private final EnhancementService enhancementService;
    private final PatchHelper patchHelper;
    private final Mapper<Connector, ConnectorDTO> connectorMapper;
    private final Mapper<ConnectorMng, ConnectorDTO> connectorMngMapper;
    private final Mapper<Enhancement, EnhancementDTO> enhancementMapper;
    private final Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMapper;
    private final Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;
    private final ObjectMapper objectMapper;
    private final ConnectionUpdateTracker historyManager;
    private final ConnectionHistoryService connectionHistoryService;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Lazy @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService connectionHistoryService,
            PatchHelper patchHelper,
            Mapper<Connector, ConnectorDTO> connectorMapper,
            Mapper<ConnectorMng, ConnectorDTO> connectorMngMapper,
            Mapper<Enhancement, EnhancementDTO> enhancementMapper,
            Mapper<FieldBindingMng, FieldBindingDTO> fieldBindingMapper,
            Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            ObjectMapper objectMapper,
            ConnectionUpdateTracker historyManager
    ) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.schedulerService = schedulerService;
        this.connectionMngService = connectionMngService;
        this.enhancementService = enhancementService;
        this.patchHelper = patchHelper;
        this.connectorMapper = connectorMapper;
        this.connectorMngMapper = connectorMngMapper;
        this.enhancementMapper = enhancementMapper;
        this.fieldBindingMapper = fieldBindingMapper;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMapper = connectionMapper;
        this.objectMapper = objectMapper;
        this.historyManager = historyManager;
        this.connectionHistoryService = connectionHistoryService;
    }


    @Override
    @Transactional(rollbackFor = {MongoException.class, DataAccessException.class})
    public ConnectionMng save(Connection connection, ConnectionMng connectionMng) {

        connectorService.getById(connection.getToConnector());
        connectorService.getById(connection.getFromConnector());

        //bind fields
        fieldBindingMngService.bind(connectionMng);

        List<Enhancement> enhancements = connection.getEnhancements();
        connection.setEnhancements(null);

        //saving connection
        Connection savedConnection = connectionRepository.save(connection);

        //saving enhancements
        enhancements.forEach(enhancement -> enhancement.setConnection(savedConnection));
        enhancementService.saveAll(enhancements);

        //saving connectionMng
        connectionMng.setConnectionId(savedConnection.getId());
        return connectionMngService.save(connectionMng);
    }

    @Override
    public Long createEmptyConnection() {
        Connection saved = connectionRepository.save(new Connection());
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setConnectionId(saved.getId());
        connectionMngService.save(connectionMng);
        connectionHistoryService.makeHistoryAndSave(saved, null, Action.CREATE);
        return saved.getId();
    }

    private Connection patchUpdate(Connection connection, JsonPatch patch) {
        if (removeEnhancement(patch, connection)) {
            JsonPatch forConnectionMng = extractForConnectionMng(patch);
            connectionMngService.patchUpdate(connection.getId(), forConnectionMng);
            return connection;
        }
        JsonPatch forConnection = extractForConnection(patch);
        Integer[] ids = undoDeletedEnhancement(forConnection, connection);
        if (ids[0] != -1) {
            JsonPatch forConnectionMng = extractForConnectionMng(patch);
            connectionMngService.patchUpdate(connection.getId(), forConnectionMng);
            fieldBindingMngService.updateEnhancementId(ids[0], ids[1]);
            return connection;
        }
        JsonPatch forConnectionMng = extractForConnectionMng(patch);
        ConnectionMng updatedConnectionMng = connectionMngService.patchUpdate(connection.getId(), forConnectionMng);

        connection.getEnhancements().forEach(e -> e.setConnection(null));
        Connection updatedConnection = patchHelper.patch(forConnection, connection, Connection.class);

        updatedConnection.getEnhancements().forEach(e -> e.setConnection(connection));
        enhancementService.saveAll(updatedConnection.getEnhancements());
        updatedConnection.setEnhancements(null);

        addConnectors(updatedConnection, updatedConnectionMng);

        connectionMngService.save(updatedConnectionMng);
        return connectionRepository.save(updatedConnection);
    }


    @Override
    public void update(Long connectionId, JsonPatch patch) {
        Connection connection = getById(connectionId);
        Connection updated = patchUpdate(connection, patch);
        historyManager.pushAndMakeHistory(updated, connection);
    }

    private boolean removeEnhancement(JsonPatch patch, Connection connection) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            String op = next.get("op").textValue();
            if (op.equals("remove") && (path.matches("/fieldBindings/\\d+"))) {
                int index = Integer.parseInt(path.split("/")[2]);
                enhancementService.deleteById(connection.getEnhancements().get(index).getId());
                connection.getEnhancements().remove(index);
                return true;
            }
        }
        return false;
    }

    private Integer[] undoDeletedEnhancement(JsonPatch patch, Connection connection) {
        Integer[] res = {-1, -1};
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            String op = next.get("op").textValue();
            if (op.equals("add") && (path.matches("/enhancements/\\d+"))) {
                Connection patched = patchHelper.patch(patch, connection, Connection.class);
                int index = Integer.parseInt(path.split("/")[2]);
                Enhancement enhancement = patched.getEnhancements().get(index);
                enhancement.setConnection(connection);
                Enhancement saved = enhancementService.save(enhancement);
                res[0] = enhancement.getId() == null ? -1 : enhancement.getId();
                res[1] = saved.getId();
            }
        }
        return res;
    }

    private JsonPatch extractForConnection(JsonPatch patch) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        List<JsonNode> nodeList = new ArrayList<>();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            if (path.matches("/fieldBindings/\\d+")) {
                path = path.replace("fieldBindings", "enhancements");
                String op = next.get("op").textValue();
                JsonNode value = next.get("value");
                if (op.equals("remove")) {
                    ObjectNode node = JsonNodeFactory.instance.objectNode();
                    node.put("op", op);
                    node.put("path", path);
                    nodeList.add(node);
                } else {
                    JsonNode fbNode = objectMapper.valueToTree(value);
                    FieldBindingMng fieldBindingMng = objectMapper.convertValue(fbNode, FieldBindingMng.class);
                    Enhancement enhancement = enhancementMapper.toEntity(fieldBindingMapper.toDTO(fieldBindingMng).getEnhancement());
                    enhancement.setId(fieldBindingMng.getEnhancementId());
                    ObjectNode node = JsonNodeFactory.instance.objectNode();
                    node.put("op", op);
                    node.put("path", path);
                    node.set("value", objectMapper.valueToTree(enhancement));
                    nodeList.add(node);
                }
            } else if (path.equals("/title") ||
                    path.equals("/description") ||
                    path.equals("/icon") ||
                    path.equals("/fromConnector") ||
                    path.equals("/toConnector")) {
                nodeList.add(next);
            }
        }
        return objectMapper.convertValue(nodeList, JsonPatch.class);
    }

    private JsonPatch extractForConnectionMng(JsonPatch patch) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            String path = nodes.next().get("path").textValue();
            if (path.equals("/fromConnector") || path.equals("/toConnector")) {
                nodes.remove();
            }
        }
        return objectMapper.convertValue(jsonNode, JsonPatch.class);
    }

    private void addConnectors(Connection connection, ConnectionMng connectionMng) {
        //if connection have fromConnector AND either connectionMng's fromConnector is null
        //or it's id is not equal to connection's id
        //then we must change/add fromConnector to connectionMng
        if (connection.getFromConnector() != 0 && (connectionMng.getFromConnector() == null || connection.getFromConnector() != connectionMng.getFromConnector().getConnectorId())) {
            Connector fromConnector = connectorService.getById(connection.getFromConnector());
            connectionMng.setFromConnector(connectorMngMapper.toEntity(connectorMapper.toDTO(fromConnector)));
        }
        //this is the same with fromConnector's
        if (connection.getToConnector() != 0 && (connectionMng.getToConnector() == null || connection.getToConnector() != connectionMng.getToConnector().getConnectorId())) {
            Connector toConnector = connectorService.getById(connection.getToConnector());
            connectionMng.setToConnector(connectorMngMapper.toEntity(connectorMapper.toDTO(toConnector)));
        }
    }

    @Override
    public String updateOperator(Long connectionId, Integer connectorId, String operatorId, JsonPatch patch) {
        return connectionMngService.updateOperator(connectionId, connectorId, operatorId, patch);
    }

    @Override
    public String updateMethod(Long connectionId, Integer connectorId, String methodId, JsonPatch patch) {
        return connectionMngService.updateMethod(connectionId, connectorId, methodId, patch);
    }

    @Override
    public String updateEnhancement(Long connectionId, String fieldBindingId, JsonPatch patch) {
        Connection connection = getById(connectionId);
        FieldBindingMng fieldBindingMng = fieldBindingMngService.findById(fieldBindingId).orElse(new FieldBindingMng());

        FieldBindingMng updatedFieldBinding = connectionMngService.updateFieldBinding(connectionId, patch, fieldBindingMng);

        if (isRemove(patch)) {
            enhancementService.deleteById(updatedFieldBinding.getEnhancementId());
        } else {
            Enhancement enhancement = enhancementMapper.toEntity(fieldBindingMapper.toDTO(updatedFieldBinding).getEnhancement());
            enhancement.setId(updatedFieldBinding.getEnhancementId());
            enhancement.setConnection(connection);
            Enhancement savedEnhancement = enhancementService.save(enhancement);

            updatedFieldBinding.setEnhancementId(savedEnhancement.getId());
            fieldBindingMngService.save(updatedFieldBinding);
        }
        return updatedFieldBinding.getFieldBindingId();
    }

    private boolean isRemove(JsonPatch patch) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String op = next.get("op").asText();
            String path = next.get("path").asText();
            if (op.equals("remove") && path.equals("")) {
                return true;
            }
        }
        return false;
    }

    @Override
    public void undo(Long connectionId) {
        Command command = historyManager.undo(connectionId);
        if (command != null) {
            try {
                patchUpdate(getById(command.getConnectionId()), command.getJsonPatch());
                connectionHistoryService.makeHistoryAndSave(getById(connectionId), command.getJsonPatch(), Action.UNDO);
            } catch (Exception e) {
                historyManager.push(command);
            }
        }
    }

    @Override
    public void deleteById(Long id) {
        Connection connection = getById(id);
        List<Scheduler> schedulers = connection.getSchedulers();

        if (schedulers != null && !schedulers.isEmpty()) {
            schedulers.forEach(s -> {
                schedulerService.deleteById(s.getId());
            });
        }
        connectionRepository.deleteById(id);
        connectionMngService.delete(id);
        connectionHistoryService.makeHistoryAndSave(connection, null, Action.DELETE);
    }

    @Override
    public void delete(Connection connection) {
        connectionRepository.delete(connection);
    }

    @Override
    public Optional<Connection> findById(Long id) {
        return connectionRepository.findById(id);
    }

    @Override
    public List<Connection> findAll() {
        return connectionRepository.findAll();
    }


    @Override
    public List<Connection> findAllByNameContains(String name) {
        return connectionRepository.findAllByTitleContains(name);
    }

    @Override
    public boolean existsByName(String name) {
        return connectionRepository.existsByTitle(name);
    }

    @Override
    public boolean existsById(Long id) {
        return connectionRepository.existsById(id);
    }

    @Override
    public List<Connection> findAllByConnectorId(int connectorId) {
        return connectionRepository.findAllByConnectorId(connectorId);
    }

    @Override
    public ConnectionMng update(Connection connection, ConnectionMng uConnectionMng) {
        getById(connection.getId());
        connectionMngService.getByConnectionId(connection.getId());
        return save(connection, uConnectionMng);
    }

    @Override
    public Connection getById(Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ConnectionNotFoundException(id));
    }

    @Override
    public ConnectionDTO getFullConnection(Long connectionId) {
        Connection connection = getById(connectionId);
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(connectionId);

        ConnectionDTO connectionDTOMng = connectionMngMapper.toDTO(connectionMng);
        ConnectionDTO connectionDTO = connectionMapper.toDTO(connection);

        connectionDTOMng.setDescription(connectionDTO.getDescription());
        connectionDTOMng.setIcon(connectionDTO.getIcon());
        connectionDTOMng.setBusinessLayout(connectionDTO.getBusinessLayout());

        if (connectionDTOMng.getFromConnector() != null) {
            ConnectorDTO temp = connectionDTOMng.getFromConnector();
            connectionDTOMng.setFromConnector(connectorMapper.toDTO(connectorService.getById(connection.getFromConnector())));
            connectionDTOMng.getFromConnector().setOperators(temp.getOperators());
            connectionDTOMng.getFromConnector().setMethods(temp.getMethods());
        }

        if (connectionDTOMng.getToConnector() != null) {
            ConnectorDTO temp = connectionDTOMng.getToConnector();
            connectionDTOMng.setToConnector(connectorMapper.toDTO(connectorService.getById(connection.getToConnector())));
            connectionDTOMng.getToConnector().setOperators(temp.getOperators());
            connectionDTOMng.getToConnector().setMethods(temp.getMethods());
        }
        return connectionDTOMng;
    }
}
