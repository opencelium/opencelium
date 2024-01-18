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

import com.becon.opencelium.backend.container.Command;
import com.becon.opencelium.backend.container.ConnectionUpdateTracker;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.entity.Scheduler;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import com.mongodb.MongoException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;
    private final ObjectMapper objectMapper;
    private final ConnectionUpdateTracker updateTracker;
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
            Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            ObjectMapper objectMapper,
            ConnectionUpdateTracker updateTracker
    ) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.schedulerService = schedulerService;
        this.connectionMngService = connectionMngService;
        this.enhancementService = enhancementService;
        this.patchHelper = patchHelper;
        this.connectorMapper = connectorMapper;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMapper = connectionMapper;
        this.objectMapper = objectMapper;
        this.updateTracker = updateTracker;
        this.connectionHistoryService = connectionHistoryService;
    }


    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // public methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------


    @Override
    @Transactional(rollbackFor = {MongoException.class, DataAccessException.class})
    public ConnectionMng save(Connection connection, ConnectionMng connectionMng) {

        //checking existence of connectors
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

    /**
     * creates new connection in mysql and mongodb.
     * creates CREATE history
     */
    @Override
    public Long createEmptyConnection() {
        Connection saved = connectionRepository.save(new Connection());
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setConnectionId(saved.getId());
        connectionMngService.saveDirectly(connectionMng);
        connectionHistoryService.makeHistoryAndSave(saved, null, Action.CREATE);
        return saved.getId();
    }

    /**
     * a wrapper method for {@link  #patchUpdateInternal(Connection, JsonPatch) patchUpdate} method.
     * USE ONLY IN CONTROLLER BECAUSE IT TRACKS THE UPDATE TO UNDO AND MAKES A HISTORY.
     */
    @Override
    public FieldBindingMng patchUpdate(Long connectionId, JsonPatch patch) {
        Connection beforePatch = getById(connectionId);
        ConnectionMng beforePatchMng = connectionMngService.getByConnectionId(connectionId);
        FieldBindingMng FB = patchUpdateInternal(beforePatch, patch);
        Connection updated = getById(connectionId);
        ConnectionMng updatedMng = connectionMngService.getByConnectionId(connectionId);
        updateTracker.pushAndMakeHistory(updated, beforePatch, updatedMng, beforePatchMng, patch);
        return FB;
    }

    @Override
    public String patchMethodOrOperator(Long connectionId, Integer connectorId, JsonPatch patch) {
        ConnectionMng connectionMng = connectionMngService.getByConnectionId(connectionId);

        String id = connectionMngService.patchMethodOrOperator(connectionId, connectorId, patch);

        ConnectionMng patched = connectionMngService.getByConnectionId(connectionId);

        if (connectionMng.getFromConnector() != null && connectorId.equals(connectionMng.getFromConnector().getConnectorId())) {
            updateTracker.pushAndMakeHistory(connectionMng, connectionMng.getFromConnector(), patched.getFromConnector(), patch);
        } else if (id != null) {
            updateTracker.pushAndMakeHistory(connectionMng, connectionMng.getToConnector(), patched.getToConnector(), patch);
        }
        return id;
    }

    @Override
    public void undo(Long connectionId) {
        synchronized (ConnectionUpdateTracker.class) {
            Command command = updateTracker.undo(connectionId);
            if (command != null) {
                try {
                    rotate(connectionId, command.getJsonPatch());
                    connectionHistoryService.makeHistoryAndSave(getById(connectionId), command.getJsonPatch(), Action.UNDO);
                } catch (Exception e) {
                    updateTracker.push(command);
                }
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

        connectionDTOMng.setTitle(connection.getTitle());
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


    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // private methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------

    /**
     * this method can be used for :
     * 1. updating basic fields of connection.
     * In this case, {@param patch} CAN ONLY be replace|add|remove patch operations ONLY with the basic fields of connection. Otherwise, this operations will be ignored
     * 2. Undoing ALL tracked updates.
     *
     * @param connection is an object to patch and MUST be already saved.
     * @return patched and saved connection
     */
    private FieldBindingMng patchUpdateInternal(Connection connection, JsonPatch patch) {

        //customize the patch for connection
        JsonPatch forConnection = patchHelper.extract(patch, p -> p.equals("/title") || p.equals("/description") || p.equals("/icon"));

        //customize the patch for connectionMng
        JsonPatch forConnectionMng = patchHelper.extract(patch, p -> p.startsWith("/fieldBindings") || p.equals("/fromConnector") || p.equals("/toConnector"));

        FieldBindingMng FB = connectionMngService.patchUpdate(connection.getId(), forConnectionMng);
        ConnectionMng updatedConnectionMng = connectionMngService.getByConnectionId(connection.getId());

        connection.setEnhancements(null);
        Connection patched = patchHelper.patch(forConnection, connection, Connection.class);

        addConnectors(patched, updatedConnectionMng);

        connectionMngService.saveDirectly(updatedConnectionMng);
        connectionRepository.save(patched);
        return FB;
    }

    private void addConnectors(Connection connection, ConnectionMng connectionMng) {

        if (connectionMng.getFromConnector() != null && (connection.getFromConnector() == 0 || connection.getFromConnector() != connectionMng.getFromConnector().getConnectorId())) {
            connection.setFromConnector(connectionMng.getFromConnector().getConnectorId());
        } else if (connectionMng.getFromConnector() == null) {
            connection.setFromConnector(0);
        }

        if (connectionMng.getToConnector() != null && (connection.getToConnector() == 0 || connection.getToConnector() != connectionMng.getToConnector().getConnectorId())) {
            connection.setToConnector(connectionMng.getToConnector().getConnectorId());
        } else if (connectionMng.getToConnector() == null) {
            connection.setToConnector(0);
        }
    }

    private void rotate(Long connectionId, JsonPatch jsonPatch) {
        Connection connection = getById(connectionId);
        JsonNode jsonNode = objectMapper.convertValue(jsonPatch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        JsonNode next = nodes.next();
        String path = next.get("path").textValue();
        if (path.startsWith("/fromConnector/")) {
            JsonPatch changed = patchHelper.changeEachPath(jsonPatch, p -> p.substring(p.indexOf("/", 1)));
            connectionMngService.patchMethodOrOperator(connectionId, connection.getFromConnector(), changed);
        } else if (path.startsWith("/toConnector/")) {
            JsonPatch changed = patchHelper.changeEachPath(jsonPatch, p -> p.substring(p.indexOf("/", 1)));
            connectionMngService.patchMethodOrOperator(connectionId, connection.getToConnector(), changed);
        } else {
            patchUpdateInternal(connection, jsonPatch);
        }

    }
}
