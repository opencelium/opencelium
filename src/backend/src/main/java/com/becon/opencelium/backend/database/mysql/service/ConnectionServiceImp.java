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

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.constant.*;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.MaskingRuleRepository;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.v5.ConnectionV5Mapper;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.masking.RuleDTO;
import com.becon.opencelium.backend.resource.partialconnection.FlowchartCreateRequest;
import com.becon.opencelium.backend.resource.partialconnection.NewConnectionCreateRequest;
import com.becon.opencelium.backend.resource.webhook.WebhookParamDTO;
import com.becon.opencelium.backend.utility.LogFileUtility;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import com.becon.opencelium.backend.versionmanager.backup.MongoDbBackupService;
import com.becon.opencelium.backend.versionmanager.base.Utils;
import com.github.fge.jsonpatch.JsonPatch;
import jakarta.persistence.EntityNotFoundException;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ConnectionServiceImp implements ConnectionService {
    private static final Logger log = LoggerFactory.getLogger(ConnectionServiceImp.class);

    private final ConnectionRepository connectionRepository;
    private final ConnectorService connectorService;
    private final ConnectionMngService connectionMngService;
    private final FieldBindingMngService fieldBindingMngService;
    private final CategoryService categoryService;
    private final ConnectionHistoryService connectionHistoryService;
    private final SchedulerService schedulerService;
    private final Mapper<Connector, ConnectorDTO> connectorMapper;
    private final Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;
    private final MaskingRuleRepository ruleRepository;
    private final WebhookService webhookService;
    private final OpenceliumProps ocProps;
    private final EntityUpdater<ConnectionMng> connectionMngEntityUpdater;
    private final MongoDbBackupService mongoDbBackupService;
    private final PatchHelper patchHelper;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("categoryServiceImp") CategoryService categoryService,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService connectionHistoryService,
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("webhookServiceImp") WebhookService webhookService,
            Mapper<Connector, ConnectorDTO> connectorMapper,
            Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            MaskingRuleRepository ruleRepository,
            EntityVersionManager entityVersionManager,
            OpenceliumProps ocProps,
            MongoDbBackupService mongoDbBackupService,
            PatchHelper patchHelper
    ) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.connectionMngService = connectionMngService;
        this.categoryService = categoryService;
        this.connectorMapper = connectorMapper;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMapper = connectionMapper;
        this.connectionHistoryService = connectionHistoryService;
        this.schedulerService = schedulerService;
        this.webhookService = webhookService;
        this.ruleRepository = ruleRepository;
        this.ocProps = ocProps;
        this.connectionMngEntityUpdater = entityVersionManager.getUpdater(ConnectionMng.class);
        this.mongoDbBackupService = mongoDbBackupService;
        this.patchHelper = patchHelper;
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
        Connector from = connectorService.getById(connection.getToConnector());
        Connector to = connectorService.getById(connection.getFromConnector());

        connectionMng.getFromConnector().setTitle(from.getTitle());
        connectionMng.getToConnector().setTitle(to.getTitle());

        connectionMng.getFromConnector().setFlowId(UUID.randomUUID().toString());
        connectionMng.getToConnector().setFlowId(UUID.randomUUID().toString());

        //checking existence of category
        if (connection.getCategoryId() != null) {
            categoryService.get(connection.getCategoryId());
        }

        connection.setOcVersion(ocProps.getVersion());

        Connection savedConnection = connectionRepository.save(connection);

        //saving connectionMng
        connectionMng.setConnectionId(savedConnection.getId());
        ConnectionMng savedMng = connectionMngService.save(connectionMng);
        connectionHistoryService.makeHistoryAndSave(savedConnection, null, Action.CREATE);
        return savedMng;
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        Connection connection = getById(id);
        deleteSchedules(connection);
        ConnectionMng deleted;
        try {
            deleted = connectionMngService.delete(id);
        } catch (Exception e) {
            connectionRepository.deleteById(id);
            return;
        }
        try {
            connectionRepository.deleteById(id);
        } catch (Exception e) {
            connectionMngService.save(deleted);
            throw e;
        }
    }

    @Override
    @Transactional
    public void deleteAll(List<Connection> connections) {
        if (connections == null) {
            return;
        }
        connections.forEach(c -> deleteById(c.getId()));
    }

    @Override
    @Transactional
    public void deleteAndTrackIt(Long id) {
        Connection connection = getById(id);
        deleteSchedules(connection);
        ConnectionMng deleted;
        try {
            deleted = connectionMngService.delete(id);
        } catch (Exception e) {
            connectionRepository.deleteById(id);
            return;
        }
        try {
            connectionRepository.deleteById(id);
            connectionHistoryService.makeHistoryAndSave(connection, null, Action.DELETE);
        } catch (Exception e) {
            connectionMngService.save(deleted);
            throw e;
        }
    }

    @Override
    @Transactional
    public void deleteOnlyConnection(Long id) {
        Connection connection = getById(id);
        deleteSchedules(connection);
        connectionRepository.deleteById(id);
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

        connectionDTOMng.setTitle(connectionDTO.getTitle());
        connectionDTOMng.setDescription(connectionDTO.getDescription());
        connectionDTOMng.setIcon(connectionDTO.getIcon());
        connectionDTOMng.setBusinessLayout(connectionDTO.getBusinessLayout());
        connectionDTOMng.setCategoryId(connectionDTO.getCategoryId());

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
    public List<Connection> getAllByCategoryId(Integer categoryId) {
        return connectionRepository.findAllByCategoryId(categoryId);
    }

    @Override
    public List<ConnectionDTO> getAllFullConnection() {
        List<Connection> all = findAll();
        List<ConnectionDTO> res = new ArrayList<>();
        for (Connection connection : all) {
            res.add(getFullConnection(connection.getId()));
        }
        return res;
    }

    @Override
    public List<Connection> findAllNotCompleted() {
        List<Connection> all = findAll();
        List<Connection> res = new ArrayList<>();
        for (Connection connection : all) {
            if (!connectionMngService.existsByConnectionId(connection.getId())) {
                res.add(connection);
            }
        }
        return res;
    }

    @Override
    public void updateCategory(Connection connection, Integer newCategory) {
        connection.setCategoryId(newCategory);
        connectionRepository.save(connection);
    }

    @Override
    public List<WebhookParamDTO> extractVarsFromJson(String json) throws IOException {
        ArrayList<String> webhookVarList = new ArrayList<>();
        extractVars(json, webhookVarList);
        return webhookVarList.stream()
                .map(webhookService::toParamResource)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaskingRule> getAllRules(long connectionId) {
        throwIfConnectionNotExists(connectionId);

        return ruleRepository.findRulesByConnectionId(connectionId);
    }

    @Override
    @Transactional(readOnly = true)
    public RuleDTO getOneRule(long connectionId, long ruleId) {
        throwIfConnectionNotExists(connectionId);

        MaskingRule rule = ruleRepository.findRuleByConnectionIdAndId(connectionId, ruleId)
                .orElseThrow(() -> new EntityNotFoundException("MaskingRule with ruleId = '" + ruleId + "' for connection with id = '" + connectionId + "' non exists."));

        return RuleDTO.fromEntity(rule);
    }

    @Override
    @Transactional
    public List<RuleDTO> saveRuleList(long connectionId, List<RuleDTO> dtos) {
        throwIfConnectionNotExists(connectionId);

        return dtos.stream()
                .map(dto -> saveRule(connectionId, dto))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RuleDTO saveRule(long connectionId, RuleDTO dto) {
        Connection connection = getById(connectionId);

        MaskingRule rule = new MaskingRule();

        rule.setType(dto.getType());
        rule.setExpression(dto.getExpression());
        rule.setConnection(connection);

        return RuleDTO.fromEntity(ruleRepository.save(rule));
    }

    @Override
    @Transactional
    public RuleDTO updateRule(long connectionId, long ruleId, RuleDTO dto) {
        throwIfConnectionNotExists(connectionId);

        MaskingRule rule = ruleRepository.findRuleByConnectionIdAndId(connectionId, ruleId)
                .orElseThrow(() -> new EntityNotFoundException("MaskingRule with ruleId = '" + ruleId + "' for connection with id = '" + connectionId + "' non exists."));

        rule.setType(dto.getType());
        rule.setExpression(dto.getExpression());

        return RuleDTO.fromEntity(rule);
    }

    @Override
    @Transactional
    public void deleteRuleList(long connectionId) {
        throwIfConnectionNotExists(connectionId);

        ruleRepository.deleteByConnectionId(connectionId);
    }

    @Override
    @Transactional
    public void deleteRule(long connectionId, long ruleId) {
        throwIfConnectionNotExists(connectionId);

        ruleRepository.deleteByConnectionIdAndId(connectionId, ruleId);
    }

    @Override
    public void updateConnectionsToCurrentVersion() {
        List<Long> ids = connectionRepository.findIds();
        boolean gotBackup = false;
        for (Long id : ids) {
            Connection connection = getById(id);
            if (Utils.compare(ocProps.getVersion(), connection.getOcVersion()) > 0 && !isTestConnection(connection.getTitle())) {

                if (!gotBackup) {
                    try {
                        mongoDbBackupService.backup();
                        gotBackup = true;
                    } catch (Exception e) {
                        log.error("Failed to backup. Skipped updating connections");
                        throw new RuntimeException(e);
                    }
                }
                AtomicBoolean connectionChanged = new AtomicBoolean(false);
                // UPDATE CONNECTION_MNG
                ConnectionMng connectionMng = connectionMngService.getByConnectionId(connection.getId());
                try {
                    connectionMngEntityUpdater.updateToCurrentVersion(connectionMng)
                            .ifChangedOrElseIfUpdated(
                                    x -> {
                                        connectionMngService.updateWithoutBinding(x);
                                        connectionChanged.set(true);
                                    }, // if any field is updated
                                    connectionMngService::saveDirectly // only version is set to the current version
                            );
                } catch (Exception e) {
                    log.error("Failed to update Connection[id={}, name={}]", connection.getId(), connection.getTitle(), e);
                    mongoDbBackupService.restore();
                    log.warn("Rolled back all changes");
                    throw new RuntimeException(e);
                }
            }
        }
        connectionRepository.updateVersion(ocProps.getVersion());
    }

    @Override
    public List<String> getLogFileNameListById(long connectionId) {
        return LogFileUtility.getLogFileNameList(connectionId);
    }

    @Override
    @Transactional
    public Long createNewConnection(NewConnectionCreateRequest request) {
        if (existsByName(request.getTitle())) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.CONNECTION_EXIST_WITH_TITLE.formatted(request.getTitle()));
        }

        if (request.getCategoryId() != null && !categoryService.exists(request.getCategoryId())) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.CATEGORY_NOT_FOUND);
        }

        Connection connection = new Connection();
        connection.setTitle(request.getTitle());
        connection.setDescription(request.getDescription());
        connection.setCategoryId(request.getCategoryId());
        connection.setOcVersion(ocProps.getVersion());

        connection = connectionRepository.save(connection);

        connectionMngService.createNewConnection(connection.getId());

        return connection.getId();
    }

    @Override
    public String addFlowchart(FlowchartCreateRequest request) {
        if (!existsById(request.getConnectionId())) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "CONNECTION_NOT_FOUND");
        }

        if (!connectorService.existsById(request.getConnectorId())) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "CONNECTOR_NOT_FOUND");
        }

        return connectionMngService.addFlowchart(request);
    }

    @Override
    @Transactional
    public void update(Long id, JsonPatch patch) {
        Connection connection = getById(id);

        JsonPatch connectionPatch = patchHelper.filterBy(patch, List.of("/title", "/description", "/categoryId", "/icon"));

        Connection patchedConnection = patchHelper.patch(connectionPatch, connection, Connection.class);

        if (!Objects.equals(patchedConnection.getTitle(), connection.getTitle())) {
            if (existsByName(patchedConnection.getTitle())) {
                throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.CONNECTION_EXIST_WITH_TITLE.formatted(patchedConnection.getTitle()));
            }
        }

        if (!Objects.equals(patchedConnection.getCategoryId(), connection.getCategoryId())) {
            if (!categoryService.exists(patchedConnection.getCategoryId())) {
                throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.CATEGORY_NOT_FOUND);
            }
        }

        connectionRepository.save(patchedConnection);
        connectionMngService.update(id, patch);
    }

    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // private methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------

    private boolean isTestConnection(String title) {
        return title != null && title.matches(RegExpression.TEST_CONNECTION_REGEX);
    }

    private void extractVars(Object json, List<String> varList) {
        if (json instanceof JSONObject jsonObject) {
            for (String key : jsonObject.keySet()) {
                extractVars(jsonObject.get(key), varList);
            }
        } else if (json instanceof JSONArray jsonArray) {
            for (Object o : jsonArray) {
                extractVars(o, varList);
            }
        } else if (json instanceof String str) {
            Pattern pattern = Pattern.compile(RegExpression.webhook);
            Matcher matcher = pattern.matcher(str);
            while (matcher.find()) {
                varList.add(matcher.group(1));
            }
        }
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

    private void throwIfConnectionNotExists(Long connectionId) {
        if (!connectionRepository.existsById(connectionId)) {
            throw new ConnectionNotFoundException(connectionId);
        }
    }
}