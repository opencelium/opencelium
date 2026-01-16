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
import com.becon.opencelium.backend.container.Command;
import com.becon.opencelium.backend.container.ConnectionUpdateTracker;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.repository.MetaDataLogRepository;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngService;
import com.becon.opencelium.backend.database.mongodb.service.ConnectionMngServiceImp;
import com.becon.opencelium.backend.database.mongodb.service.FieldBindingMngService;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.MaskingRuleRepository;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.exception.CategoryValidationException;
import com.becon.opencelium.backend.exception.ConnectionValidationException;
import com.becon.opencelium.backend.exception.ConnectorNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.ConnectorDTO;
import com.becon.opencelium.backend.resource.connection.masking.RuleDTO;
import com.becon.opencelium.backend.resource.webhook.WebhookParamDTO;
import com.becon.opencelium.backend.utility.LogFileUtility;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import com.becon.opencelium.backend.versionmanager.backup.MongoDbBackupService;
import com.becon.opencelium.backend.versionmanager.backup.MysqlBackupService;
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
import org.springframework.util.CollectionUtils;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ConnectionServiceImp implements ConnectionService {
    private static final Logger log = LoggerFactory.getLogger(ConnectionServiceImp.class);
    private static final String TEST_PREFIX_LIKE = "!*test_connection_%";
    private static final int CHUNK_SIZE = 1000;

    private final ConnectionRepository connectionRepository;
    private final ConnectorService connectorService;
    private final ConnectionMngService connectionMngService;
    private final FieldBindingMngService fieldBindingMngService;
    private final EnhancementService enhancementService;
    private final CategoryService categoryService;
    private final ConnectionHistoryService connectionHistoryService;
    private final SchedulerService schedulerService;
    private final Mapper<Connector, ConnectorDTO> connectorMapper;
    private final Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper;
    private final Mapper<Connection, ConnectionDTO> connectionMapper;
    private final ConnectionUpdateTracker updateTracker;
    private final MaskingRuleRepository ruleRepository;
    private final PatchHelper patchHelper;
    private final WebhookService webhookService;
    private final OpenceliumProps ocProps;
    private final EntityUpdater<ConnectionMng> connectionMngEntityUpdater;
    private final EntityUpdater<Enhancement> enhancementEntityUpdater;
    private final MysqlBackupService mysqlBackupService;
    private final MongoDbBackupService mongoDbBackupService;
    private final MetaDataLogRepository metaDataLogRepository;
    private final ConnectionValidator connectionValidator;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
            @Qualifier("categoryServiceImp") CategoryService categoryService,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService connectionHistoryService,
            @Qualifier("schedulerServiceImp") SchedulerService schedulerService,
            @Qualifier("webhookServiceImp") WebhookService webhookService,
            PatchHelper patchHelper,
            Mapper<Connector, ConnectorDTO> connectorMapper,
            Mapper<ConnectionMng, ConnectionDTO> connectionMngMapper,
            Mapper<Connection, ConnectionDTO> connectionMapper,
            ConnectionUpdateTracker updateTracker,
            MaskingRuleRepository ruleRepository,
            EntityVersionManager entityVersionManager,
            OpenceliumProps ocProps,
            MysqlBackupService mysqlBackupService,
            MongoDbBackupService mongoDbBackupService,
            MetaDataLogRepository metaDataLogRepository, ConnectionValidator connectionValidator
    ) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.connectionMngService = connectionMngService;
        this.enhancementService = enhancementService;
        this.categoryService = categoryService;
        this.patchHelper = patchHelper;
        this.connectorMapper = connectorMapper;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMapper = connectionMapper;
        this.updateTracker = updateTracker;
        this.connectionHistoryService = connectionHistoryService;
        this.schedulerService = schedulerService;
        this.webhookService = webhookService;
        this.ruleRepository = ruleRepository;
        this.ocProps = ocProps;
        this.connectionMngEntityUpdater = entityVersionManager.getUpdater(ConnectionMng.class);
        this.enhancementEntityUpdater = entityVersionManager.getUpdater(Enhancement.class);
        this.mysqlBackupService = mysqlBackupService;
        this.mongoDbBackupService = mongoDbBackupService;
        this.metaDataLogRepository = metaDataLogRepository;
        this.connectionValidator = connectionValidator;
    }


    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // public methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    @Override
    @Transactional
    public ConnectionMng save(Connection connection, ConnectionMng connectionMng) {
        connectionValidator.validateCreate(connection, connectionMng);

        try {
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

            List<Enhancement> enhancements = connection.getEnhancements();
            connection.setOcVersion(ocProps.getVersion());
            connection.setEnhancements(null);

            Connection savedConnection = connectionRepository.save(connection);

            //saving enhancements
            if (enhancements != null && !enhancements.isEmpty()) {
                enhancements.forEach(enhancement -> enhancement.setConnection(savedConnection));
                enhancements = enhancementService.saveAll(enhancements);
                for (int i = 0; i < connectionMng.getFieldBindings().size(); i++) {
                    connectionMng.getFieldBindings().get(i).setEnhancementId(enhancements.get(i).getId());
                }
            }

            //saving connectionMng
            connectionMng.setConnectionId(savedConnection.getId());
            ConnectionMng savedMng = connectionMngService.save(connectionMng);
            connectionHistoryService.makeHistoryAndSave(savedConnection, null, Action.CREATE);
            return savedMng;
        } catch (ConnectorNotFoundException e) {
            throw ConnectionValidationException.connectorNotFound(e.getId());
        } catch (CategoryValidationException e) {
            throw new ConnectionValidationException(e.getMessage());
        } catch (ConnectionValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new ConnectionValidationException(e.getMessage());
        }
    }

    @Override
    @Transactional
    public void update(Connection connection, ConnectionMng connectionMng) {
        Connection sCon = getById(connection.getId());

        connectionValidator.validateUpdate(sCon, connection, connectionMng);

        try {
            ConnectionMng oldMng = connectionMngService.getByConnectionId(connection.getId());
            if (connectionMng.getId() == null || !oldMng.getId().equals(connectionMng.getId())) {
                connectionMng.setId(oldMng.getId());
            }

            //checking existence of connectors
            Connector from = connectorService.getById(connection.getToConnector());
            Connector to = connectorService.getById(connection.getFromConnector());

            connectionMng.getFromConnector().setTitle(from.getTitle());
            connectionMng.getToConnector().setTitle(to.getTitle());

            connectionMng.getFromConnector().setFlowId(oldMng.getFromConnector().getFlowId());
            connectionMng.getToConnector().setFlowId(oldMng.getToConnector().getFlowId());

            //checking existence of category
            if (connection.getCategoryId() != null && !connection.getCategoryId().equals(sCon.getCategoryId())) {
                categoryService.get(connection.getCategoryId());
            }

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

            // there is not ocVersion field on ConnectionOldDTO, set connection's version with current system version
            connection.setOcVersion(ocProps.getVersion());

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
        } catch (ConnectorNotFoundException e) {
            throw ConnectionValidationException.connectorNotFound(e.getId());
        } catch (CategoryValidationException e) {
            throw new ConnectionValidationException(e.getMessage());
        } catch (ConnectionValidationException e) {
            throw e;
        } catch (Exception e) {
            throw ConnectionValidationException.unknownError(e.getMessage());
        }
    }

    @Override
    public Long createEmptyConnection() {
        Connection connection = new Connection();
        connection.setOcVersion(ocProps.getVersion());
        Connection saved = connectionRepository.save(connection);
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setConnectionId(saved.getId());
        connectionMng.setVersion(ocProps.getVersion());
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
                .orElseThrow(() -> ConnectionValidationException.connectionNotFound(id));
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
                    gotBackup = true;

                    try {
                        mysqlBackupService.backup(EntityNames.ENHANCEMENT);
                    } catch (Exception e) {
                        log.error("Failed to take backup {} table from mysql. Continuing updating connections without backup", EntityNames.ENHANCEMENT);
                    }

                    try {
                        mongoDbBackupService.backup();
                    } catch (Exception e) {
                        log.error("Failed to take backup from MongoDB. Continuing updating connections without backup");
                    }
                }

                // UPDATE CONNECTION_MNG
                ConnectionMng connectionMng;
                try {
                    connectionMng = connectionMngService.getByConnectionId(connection.getId());
                } catch (Exception e) {
                    log.error("Failed to find Connection[id={}, name={}] on MongoDB with id {}. Skipped updating", connection.getId(), connection.getTitle(), connection.getId());
                    continue;
                }

                try {

                    clearLogsWithNullFlowId(connectionMng);

                    connectionMngEntityUpdater.updateToCurrentVersion(connectionMng)
                            .ifChangedOrElseIfUpdated(
                                    connectionMngService::updateWithoutBinding, // if any field is updated
                                    connectionMngService::saveDirectly // only version is set to the current version
                            );
                } catch (Exception e) {
                    log.error("Failed to update Connection[id={}, name={}]", connection.getId(), connection.getTitle(), e);
                    continue;
                }

                // UPDATE ENHANCEMENTS
                try {
                    connection.getEnhancements().forEach(enhancement -> enhancementEntityUpdater.updateFrom(enhancement, connection.getOcVersion())
                            .ifChanged(x -> enhancementService.save(enhancement)));
                } catch (Exception e) {
                    log.error("Failed to update Connection[id={}, name={}]", connection.getId(), connection.getTitle(), e);
                    continue;
                }

                connection.setOcVersion(ocProps.getVersion());
                connectionRepository.save(connection);

                log.info("Connection[id={}, name={}] is successfully updated to {} version", connection.getId(), connection.getTitle(), ocProps.getVersion());
            }
        }
    }

    private void clearLogsWithNullFlowId(ConnectionMng connectionMng) {
        if (connectionMng.getFromConnector() != null && connectionMng.getFromConnector().getFlowId() == null
                || connectionMng.getToConnector() != null && connectionMng.getToConnector().getFlowId() == null) {

            try {
                long deletedItems = metaDataLogRepository.deleteAllByConnectionId(connectionMng.getConnectionId());
                if (deletedItems > 0) {
                    log.info("Deleted {} logData items of Connection[id={}] due to null flowId field", deletedItems, connectionMng.getConnectionId());
                }
            } catch (Exception e) {
                log.error("Failed to clear logs of Connection[id={}] with null flowId field ", connectionMng.getConnectionId(), e);
            }
        }
    }

    @Override
    public List<String> getLogFileNameListById(long connectionId) {
        return LogFileUtility.getLogFileNameList(connectionId);
    }

    @Override
    public List<Connection> findAllByIds(IdentifiersDTO<Long> ids) {
        if (ids == null || CollectionUtils.isEmpty(ids.getIdentifiers())) {
            return Collections.emptyList();
        }

        return connectionRepository.findAllById(ids.getIdentifiers());
    }

    /**
     * Full cleanup:
     * 1) find test connection ids in MariaDB
     * 2) delete Mongo docs referencing those ids
     * 3) delete MariaDB rows by ids
     *
     * Idempotent: can be run multiple times safely.
     */
    @Override
    @Transactional
    public CleanupResult cleanupAllTestConnections() {
        log.info("Test connection cleanup completed started");
        List<Long> ids = connectionRepository.findIdsByTitleLike(TEST_PREFIX_LIKE);
        if (ids.isEmpty()) return new CleanupResult(0, 0, 0);

        long totalMongoDeleted = 0;
        int totalSqlDeleted = 0;

        for (List<Long> chunk : chunks(ids, CHUNK_SIZE)) {
            // delete mongo first (so we don’t keep dangling refs if SQL delete succeeds)
            totalMongoDeleted += connectionMngService.deleteByConnectionIdIn(chunk);

            // then delete SQL rows
            totalSqlDeleted += deleteSqlChunk(chunk);
        }
        CleanupResult cleanupResult = new CleanupResult(ids.size(), totalMongoDeleted, totalSqlDeleted);
        log.info(
                "Test connection cleanup completed: candidates={}, mongoDeleted={}, sqlDeleted={}",
                cleanupResult.candidateSqlIds(),
                cleanupResult.mongoDeleted(),
                cleanupResult.sqlDeleted()
        );
        return cleanupResult;
    }

    @Transactional
    protected int deleteSqlChunk(List<Long> chunk) {
        chunk.forEach(this::deleteById);
        return chunk.size();
    }

    private static <T> List<List<T>> chunks(List<T> list, int size) {
        List<List<T>> out = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            out.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return out;
    }

    public record CleanupResult(int candidateSqlIds, long mongoDeleted, int sqlDeleted) {}

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

    private void throwIfConnectionNotExists(Long connectionId) {
        if (!connectionRepository.existsById(connectionId)) {
            throw ConnectionValidationException.connectionNotFound(connectionId);
        }
    }
}