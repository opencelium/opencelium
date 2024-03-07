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
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.github.fge.jsonpatch.JsonPatch;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class ConnectionServiceImp implements ConnectionService {
    private final ConnectionRepository connectionRepository;
    private final ConnectorService connectorService;
    private final ConnectionMngService connectionMngService;
    private final FieldBindingMngService fieldBindingMngService;
    private final EnhancementService enhancementService;
    private final PatchHelper patchHelper;
    private final Mapper<Connector, ConnectorDTO> connectorMapper;
    private final Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;
    private final ConnectionUpdateTracker updateTracker;
    private final ConnectionHistoryService connectionHistoryService;
    private final SchedulerService schedulerService;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService connectionHistoryService,
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            PatchHelper patchHelper,
            Mapper<Connector, ConnectorDTO> connectorMapper,
            Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            ConnectionUpdateTracker updateTracker) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.connectionMngService = connectionMngService;
        this.enhancementService = enhancementService;
        this.patchHelper = patchHelper;
        this.connectorMapper = connectorMapper;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMapper = connectionMapper;
        this.updateTracker = updateTracker;
        this.connectionHistoryService = connectionHistoryService;
        this.schedulerService = schedulerService;
    }


    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // public methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------


    @Override
    @Transactional
    public ConnectionMng save(Connection connection, ConnectionMng connectionMng) {
        if (existsByName(connection.getTitle())) {
            throw new RuntimeException("TITLE_HAS_ALREADY_TAKEN");
        }

        //checking existence of connectors
        connectorService.getById(connection.getToConnector());
        connectorService.getById(connection.getFromConnector());

        List<Enhancement> enhancements = connection.getEnhancements();
        connection.setEnhancements(null);

        Connection savedConnection = connectionRepository.save(connection);

        //saving enhancements
        if (enhancements != null && !enhancements.isEmpty()) {
            enhancements.forEach(enhancement -> enhancement.setConnection(savedConnection));
            enhancementService.saveAll(enhancements);
            for (int i = 0; i < connectionMng.getFieldBindings().size(); i++) {
                connectionMng.getFieldBindings().get(i).setEnhancementId(enhancements.get(i).getId());
            }
        }

        //saving connectionMng
        connectionMng.setConnectionId(savedConnection.getId());
        return connectionMngService.save(connectionMng);
    }

    @Override
    @Transactional
    public void update(Connection connection, ConnectionMng connectionMng) {
        Connection sCon = getById(connection.getId());
        if (!Objects.equals(sCon.getTitle(), connection.getTitle())) {
            if (existsByName(connection.getTitle())) {
                throw new RuntimeException("TITLE_HAS_ALREADY_TAKEN");
            }
        }

        ConnectionMng oldMng = connectionMngService.getByConnectionId(connection.getId());
        if (connectionMng.getId() == null || !oldMng.getId().equals(connectionMng.getId())) {
            connectionMng.setId(oldMng.getId());
        }

        //checking existence of connectors
        connectorService.getById(connection.getToConnector());
        connectorService.getById(connection.getFromConnector());

        List<Enhancement> enhancements = connection.getEnhancements();
        connection.setEnhancements(null);

        List<FieldBindingMng> newFieldBindings = getNewEnhancements(oldMng, connectionMng);
        for (FieldBindingMng fb : newFieldBindings) {
            if (fb.getEnhancementId() != null) {
                enhancements.stream().filter(e -> fb.getEnhancementId().equals(e.getId())).forEach(en -> en.setId(null));
            }
        }
        List<FieldBindingMng> fieldBindingsToDelete = getEnhancementsToDelete(oldMng, connectionMng);
        fieldBindingsToDelete.forEach(f -> enhancementService.deleteById(f.getEnhancementId()));

        Connection savedConnection = connectionRepository.save(connection);
        if (enhancements != null && !enhancements.isEmpty()) {
            enhancements.forEach(enhancement -> enhancement.setConnection(savedConnection));
            enhancementService.saveAll(enhancements);
            for (int i = 0; i < connectionMng.getFieldBindings().size(); i++) {
                connectionMng.getFieldBindings().get(i).setEnhancementId(enhancements.get(i).getId());
            }
        }

        connectionMng.setConnectionId(savedConnection.getId());
        connectionMngService.updateAndBind(oldMng, connectionMng);
    }

    @Override
    public Long createEmptyConnection() {
        Connection saved = connectionRepository.save(new Connection());
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setConnectionId(saved.getId());
        connectionMngService.saveDirectly(connectionMng);
        connectionHistoryService.makeHistoryAndSave(saved, null, Action.CREATE);
        return saved.getId();
    }

    @Override
    @Transactional
    public void patchUpdate(Long connectionId, JsonPatch patch, PatchConnectionDetails details) {
        ConnectionDTO connectionDTO = getFullConnection(connectionId);
        ConnectionDTO patched = patchUpdateInternal(connectionDTO, patch, details);
        updateTracker.pushAndMakeHistory(connectionDTO, patched, patch);
    }

    @Override
    public void undo(Long connectionId) {
        synchronized (ConnectionUpdateTracker.class) {
            Command command = updateTracker.undo(connectionId);
            if (command != null) {
                try {
                    PatchConnectionDetails details = patchHelper.describe(command.getJsonPatch());
                    ConnectionDTO connectionDTO = getFullConnection(connectionId);
                    patchUpdateInternal(connectionDTO, command.getJsonPatch(), details);
                    connectionHistoryService.makeHistoryAndSave(new Connection(connectionId), command.getJsonPatch(), Action.UNDO);
                } catch (Exception e) {
                    updateTracker.push(command);
                }
            }
        }
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        Connection connection = getById(id);
        deleteSchedules(connection);
        connectionRepository.deleteById(id);
        connectionMngService.delete(id);
    }

    @Override
    @Transactional
    public void deleteAndTrackIt(Long id) {
        Connection connection = getById(id);
        deleteSchedules(connection);
        connectionRepository.deleteById(id);
        connectionMngService.delete(id);
        connectionHistoryService.makeHistoryAndSave(connection, null, Action.DELETE);
    }

    @Override
    @Transactional
    public void deleteOnlyConnection(Long id) {
        Connection connection = getById(id);
        deleteSchedules(connection);
        connectionRepository.deleteById(id);
    }

    @Override
    public Optional<Connection> findById(Long id) {
        return connectionRepository.findById(id);
    }

    @Override
    public Connection getById(Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ConnectionNotFoundException(id));
    }

    @Override
    public List<Connection> findAll() {
        return connectionRepository.findAll();
    }

    @Override
    public List<Connection> findAllByConnectorId(int connectorId) {
        return connectionRepository.findAllByConnectorId(connectorId);
    }

    @Override
    public List<Connection> findAllByNameContains(String name) {
        return connectionRepository.findAllByTitleContains(name);
    }

    @Override
    public List<Connection> getAllConnectionsNotContains(List<Long> ids) {
        return connectionRepository.findAllByIdNotIn(ids);
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
            connectionDTOMng.getFromConnector().setOperators(temp.getOperators() == null ? new ArrayList<>() : temp.getOperators());
            connectionDTOMng.getFromConnector().setMethods(temp.getMethods() == null ? new ArrayList<>() : temp.getMethods());
        }

        if (connectionDTOMng.getToConnector() != null) {
            ConnectorDTO temp = connectionDTOMng.getToConnector();
            connectionDTOMng.setToConnector(connectorMapper.toDTO(connectorService.getById(connection.getToConnector())));
            connectionDTOMng.getToConnector().setOperators(temp.getOperators() == null ? new ArrayList<>() : temp.getOperators());
            connectionDTOMng.getToConnector().setMethods(temp.getMethods() == null ? new ArrayList<>() : temp.getMethods());
        }

        if (connectionDTOMng.getFieldBinding() == null) {
            connectionDTOMng.setFieldBinding(new ArrayList<>());
        }
        fieldBindingMngService.detach(connectionDTOMng);
        return connectionDTOMng;
    }

    @Override
    public List<ConnectionDTO> getAllFullConnection() {
        List<Connection> all = connectionRepository.findAll();
        List<ConnectionDTO> res = new ArrayList<>();
        for (Connection connection : all) {
            res.add(getFullConnection(connection.getId()));
        }
        return res;
    }


    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // private methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    private ConnectionDTO patchUpdateInternal(ConnectionDTO connectionDTO, JsonPatch patch, PatchConnectionDetails details) {
        ConnectionDTO patched = patchHelper.patch(patch, connectionDTO, ConnectionDTO.class);

        doWithConnectorsAfterPatch(connectionDTO);
        doWithConnectorsAfterPatch(patched);

        connectionMngService.doWithPatchedConnection(connectionDTO, patched, details);

        Connection connection = connectionMapper.toEntity(patched);
        connection.setEnhancements(null);
        connectionRepository.save(connection);

        ConnectionMng connectionMng = connectionMngMapper.toEntity(patched);
        connectionMngService.saveDirectly(connectionMng);
        return patched;
    }

    private void doWithConnectorsAfterPatch(ConnectionDTO connectionDTO) {
        if (connectionDTO.getFromConnector() != null) {
            ConnectorDTO fromConnector = connectionDTO.getFromConnector();
            if (fromConnector.getConnectorId() == null || !connectorService.existsById(fromConnector.getConnectorId())) {
                connectionDTO.setFromConnector(null);
            } else {
                setDefaultValues(fromConnector);
            }
        }
        if (connectionDTO.getToConnector() != null) {
            ConnectorDTO toConnector = connectionDTO.getToConnector();
            if (toConnector.getConnectorId() == null || !connectorService.existsById(toConnector.getConnectorId())) {
                connectionDTO.setFromConnector(null);
            } else {
                setDefaultValues(toConnector);
            }
        }
    }

    private void setDefaultValues(ConnectorDTO connectorDTO) {
        connectorDTO.setTitle(null);
        connectorDTO.setSslCert(false);
        connectorDTO.setIcon(null);
        connectorDTO.setInvoker(null);
        connectorDTO.setTimeout(0);
        connectorDTO.setBusinessLayout(null);
    }


    private List<FieldBindingMng> getNewEnhancements(ConnectionMng old, ConnectionMng connectionMng) {
        List<FieldBindingMng> list = new ArrayList<>();

        if (connectionMng.getFieldBindings() != null) {
            if (old.getFieldBindings() == null) {
                connectionMng.getFieldBindings().forEach(f -> f.setId(null));
                return connectionMng.getFieldBindings();
            }
            for (FieldBindingMng fieldBinding : connectionMng.getFieldBindings()) {
                if (fieldBinding.getId() == null) {
                    list.add(fieldBinding);
                } else {
                    if (old.getFieldBindings().stream().noneMatch(fb -> fb.getId().equals(fieldBinding.getId()))) {
                        fieldBinding.setId(null);
                        list.add(fieldBinding);
                    }
                }
            }
        }
        return list;
    }

    private List<FieldBindingMng> getEnhancementsToDelete(ConnectionMng old, ConnectionMng connectionMng) {
        List<FieldBindingMng> list = new ArrayList<>();
        if (old.getFieldBindings() != null) {
            for (FieldBindingMng fb : old.getFieldBindings()) {
                if (connectionMng.getFieldBindings() != null) {
                    connectionMng.getFieldBindings().stream()
                            .filter((f) -> (fb.getId().equals(f.getId())))
                            .findAny()
                            .ifPresentOrElse((f) -> {
                            }, () -> list.add(fb));
                }
            }
        }
        return list;
    }

    private void deleteSchedules(Connection connection) {
        if (connection == null || connection.getSchedulers() == null) {
            return;
        }
        connection.getSchedulers().forEach(s -> schedulerService.deleteById(s.getId()));
    }
}