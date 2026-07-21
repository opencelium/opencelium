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

import com.becon.opencelium.backend.commons.filter.OwnershipSecurity;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.constant.*;
import com.becon.opencelium.backend.container.Command;
import com.becon.opencelium.backend.container.ConnectionUpdateTracker;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.service.*;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.database.mysql.repository.ConnectionRepository;
import com.becon.opencelium.backend.database.mysql.repository.MaskingRuleRepository;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.IdentifiersDTO;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.*;
import com.becon.opencelium.backend.resource.connection.masking.RuleDTO;
import com.becon.opencelium.backend.resource.webhook.WebhookParamDTO;
import com.becon.opencelium.backend.utility.LogFileUtility;
import com.becon.opencelium.backend.utility.TestNameUtils;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import com.becon.opencelium.backend.versionmanager.base.UpdaterVersion;
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
import java.util.function.Function;
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
    private final EntityUpdater<ConnectionMng> connectionMngStartupUpdater;
    private final OwnershipSecurity ownershipSecurity;

    public ConnectionServiceImp(
            ConnectionRepository connectionRepository,
            @Qualifier("connectorServiceImp") ConnectorService connectorService,
            @Qualifier("connectionMngServiceImp") ConnectionMngServiceImp connectionMngService,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
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
            OwnershipSecurity ownershipSecurity
    ) {
        this.connectionRepository = connectionRepository;
        this.connectorService = connectorService;
        this.fieldBindingMngService = fieldBindingMngService;
        this.connectionMngService = connectionMngService;
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
        this.connectionMngStartupUpdater = entityVersionManager.getUpdater(ConnectionMng.class, UpdaterVersion.VERSION_4_8);
        this.ownershipSecurity = ownershipSecurity;
    }

    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // public methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    @Override
    @Transactional
    public Long save(Connection connection, ConnectionMng connectionMng) {
        if (existsByName(connection.getTitle())) {
            throw new RuntimeException("TITLE_HAS_ALREADY_TAKEN");
        }

        if (connection.getFromConnector() == null) {
            throw new GeneralServiceException(ExceptionConstant.CONNECTOR_NOT_FOUND, ExceptionMessages.FROM_CONNECTOR_IS_NULL);
        }

        connectionMng.getFromConnector().setFlowId(UUID.randomUUID().toString());

        if (Objects.equals(connection.getFromConnector(), ConnectionConstants.DEFAULT_CONNECTOR_ID)) {
            connectionMng.getFromConnector().setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);
        } else {
            Connector from = connectorService.getById(connection.getFromConnector());
            connectionMng.getFromConnector().setTitle(from.getTitle());
        }

        if (connection.getToConnector() != null) {
            Connector to = connectorService.getById(connection.getToConnector());
            connectionMng.getToConnector().setTitle(to.getTitle());
            connectionMng.getToConnector().setFlowId(UUID.randomUUID().toString());
        }

        //checking existence of category
        if (connection.getCategoryId() != null) {
            categoryService.get(connection.getCategoryId());
        }

        ConnectionMng savedMng = connectionMngService.create(connectionMng);

        String version = resolveVersion(connection);
        connection.setOcVersion(version);
        connection.setSnapshotId(savedMng.getId());
        Connection savedConnection = connectionRepository.save(connection);

        savedMng.setConnectionId(savedConnection.getId());
        savedMng.setVersion(version);
        connectionMngService.save(savedMng);

        connectionHistoryService.makeHistoryAndSave(savedConnection, null, Action.CREATE);
        return savedConnection.getId();
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

        ConnectionMng oldMng = connectionMngService.getById(sCon.getSnapshotId());

        if (connection.getFromConnector() == null) {
            throw new GeneralServiceException(ExceptionConstant.CONNECTOR_NOT_FOUND, ExceptionMessages.FROM_CONNECTOR_IS_NULL);
        }

        connectionMng.getFromConnector().setFlowId(oldMng.getFromConnector().getFlowId());

        if (Objects.equals(connection.getFromConnector(), ConnectionConstants.DEFAULT_CONNECTOR_ID)) {
            connectionMng.getFromConnector().setTitle(ConnectionConstants.DEFAULT_CONNECTOR_NAME);
        } else {
            Connector from = connectorService.getById(connection.getFromConnector());
            connectionMng.getFromConnector().setTitle(from.getTitle());
        }

        if (connection.getToConnector() != null) {
            Connector to = connectorService.getById(connection.getToConnector());
            connectionMng.getToConnector().setTitle(to.getTitle());
            connectionMng.getToConnector().setFlowId(oldMng.getToConnector().getFlowId());
        }

        //checking existence of category
        if (connection.getCategoryId() != null && !connection.getCategoryId().equals(sCon.getCategoryId())) {
            categoryService.get(connection.getCategoryId());
        }

        connectionMng.setId(null);
        connectionMng.setConnectionId(connection.getId());
        ConnectionMng savedMng = connectionMngService.create(connectionMng);

        String version = resolveVersion(connection);
        savedMng.setVersion(version);
        connectionMngService.save(savedMng);

        connection.setOcVersion(version);
        connection.setSnapshotId(savedMng.getId());
        connection.setRevision(sCon.getRevision());
        connectionRepository.save(connection);
    }

    @Override
    public Long createEmptyConnection() {
        Connection connection = new Connection();
        connection.setOcVersion(ocProps.getVersion());
        Connection saved = connectionRepository.save(connection);
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setVersion(ocProps.getVersion());
        connectionMngService.save(connectionMng);
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

        connectionMngService.deleteAllByConnectionId(connection.getId());
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

        connectionRepository.deleteById(id);

        connectionMngService.deleteAllByConnectionId(connection.getId());

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
    public Connection getById(Long id) {
        return connectionRepository.findById(id)
                .orElseThrow(() -> new ConnectionNotFoundException(id));
    }

    @Override
    public List<Connection> findAll() {
        return findAll(false);
    }

    @Override
    public List<Connection> findAll(Boolean includeTest) {
        return excludeTestIfNeeded(connectionRepository.findAll(), includeTest);
    }

    @Override
    public List<Connection> findAllByConnectorId(int connectorId) {
        return findAllByConnectorId(connectorId, false);
    }

    @Override
    public List<Connection> findAllByConnectorId(int connectorId, Boolean includeTest) {
        return excludeTestIfNeeded(connectionRepository.findAllByConnectorId(connectorId), includeTest);
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
        return getFullConnection(connection, connection.getSnapshotId());
    }

    private ConnectionDTO getFullConnection(Connection connection, String snapshotId) {
        ConnectionMng connectionMng = connectionMngService.getById(snapshotId);

        if (!Objects.equals(connectionMng.getConnectionId(), connection.getId())) {
            throw new RuntimeException("CONNECTION_NOT_FOUND");
        }

        ConnectionDTO connectionDTOMng = connectionMngMapper.toDTO(connectionMng);
        ConnectionDTO connectionDTO = connectionMapper.toDTO(connection);

        connectionDTOMng.setConnectionId(connectionDTO.getConnectionId());
        connectionDTOMng.setTitle(connectionDTO.getTitle());
        connectionDTOMng.setDescription(connectionDTO.getDescription());
        connectionDTOMng.setIcon(connectionDTO.getIcon());
        connectionDTOMng.setBusinessLayout(connectionDTO.getBusinessLayout());
        connectionDTOMng.setCategoryId(connectionDTO.getCategoryId());

        if (connectionDTOMng.getFromConnector() != null) {
            if(!Objects.equals(ConnectionConstants.DEFAULT_CONNECTOR_ID, connectionDTOMng.getFromConnector().getConnectorId())) {
                ConnectorDTO temp = connectionDTOMng.getFromConnector();
                connectionDTOMng.setFromConnector(connectorMapper.toDTO(connectorService.getById(connection.getFromConnector())));
                connectionDTOMng.getFromConnector().setOperators(temp.getOperators() == null ? new ArrayList<>() : temp.getOperators());
                connectionDTOMng.getFromConnector().setMethods(temp.getMethods() == null ? new ArrayList<>() : temp.getMethods());
            } else {
                fillMethodInvoker(connectionDTOMng.getFromConnector());
            }
        }

        if (connection.getToConnector() != null) {
            ConnectorDTO temp = connectionDTOMng.getToConnector();
            if (temp != null) {
                connectionDTOMng.setToConnector(connectorMapper.toDTO(connectorService.getById(connection.getToConnector())));
                connectionDTOMng.getToConnector().setOperators(temp.getOperators() == null ? new ArrayList<>() : temp.getOperators());
                connectionDTOMng.getToConnector().setMethods(temp.getMethods() == null ? new ArrayList<>() : temp.getMethods());
            }
        }

        if (connectionDTOMng.getFieldBinding() == null) {
            connectionDTOMng.setFieldBinding(new ArrayList<>());
        }
        fieldBindingMngService.detach(connectionDTOMng);
        return connectionDTOMng;
    }

    private void fillMethodInvoker(ConnectorDTO connector) {
        if (connector == null || CollectionUtils.isEmpty(connector.getMethods())) {
            return;
        }

        Set<Integer> ids = connector.getMethods().stream()
                .map(x -> x.getConnector() != null && x.getConnector().getInvoker() == null ? x.getConnector().getConnectorId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Integer, Connector> connectorById = connectorService.getAllById(ids).stream()
                .collect(Collectors.toMap(Connector::getId, Function.identity()));

        for (MethodDTO method : connector.getMethods()) {
            if (method.getConnector() != null && method.getConnector().getInvoker() == null) {
                Connector methodConnector = connectorById.get(method.getConnector().getConnectorId());
                method.getConnector().setInvoker(methodConnector != null ? methodConnector.getInvoker() : null);
            }
        }
    }

    @Override
    public ConnectionDTO getFullConnection(Long connectionId, String snapshotId) {
        Connection connection = getById(connectionId);
        return getFullConnection(connection, snapshotId);
    }

    @Override
    public List<Connection> getAllByCategoryId(Integer categoryId) {
        return connectionRepository.findAllByCategoryId(categoryId);
    }

    @Override
    public List<ConnectionDTO> getAllFullConnection() {
        return getAllFullConnection(false);
    }

    @Override
    public List<ConnectionDTO> getAllFullConnection(Boolean includeTest) {
        List<Connection> all = findAll(includeTest);
        List<ConnectionDTO> res = new ArrayList<>();
        for (Connection connection : all) {
            res.add(getFullConnection(connection.getId()));
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
        // Startup migration stops at 4.8; the 5.0 transform is applied on the read path only.
        String targetVersion = UpdaterVersion.VERSION_4_8.getVersion();
        List<Long> ids = connectionRepository.findIds();

        for (Long id : ids) {
            Connection connection = getById(id);
            if (Utils.compare(targetVersion, connection.getOcVersion()) > 0 && TestNameUtils.isNotTestConnection(connection.getTitle())) {

                List<ConnectionMng> connections = connectionMngService.getAllByConnectionIdRaw(connection.getId());
                if (connections.isEmpty()) {
                    log.error("Failed to find Connection[id={}, name={}] on MongoDB. Skipped updating", connection.getId(), connection.getTitle());
                    continue;
                }

                try {
                    for (ConnectionMng connectionMng : connections) {
                        connectionMngStartupUpdater.updateToCurrentVersion(connectionMng);

                        if (connectionMng.getCreatedBy() == null) {
                            connectionMng.setCreatedBy(connection.getCreatedBy());
                        }
                        connectionMngService.save(connectionMng);
                    }

                    log.info("Connection[id={}, name={}, version={}] successfully updated to {} version", connection.getId(), connection.getTitle(), connection.getOcVersion(), targetVersion);
                } catch (Exception e) {
                    log.error("Failed to update Connection[id={}, name={}, version={}]", connection.getId(), connection.getTitle(), connection.getOcVersion(), e);
                    continue;
                }

                if (connection.getSnapshotId() == null) {
                    ConnectionMng lastConnection = connections.stream().max(Comparator.comparing(ConnectionMng::getCreatedAt)).get();
                    connection.setSnapshotId(lastConnection.getId());
                }

                connection.setOcVersion(targetVersion);
                connectionRepository.save(connection);
            }
        }
    }

    @Override
    public List<String> getLogFileNameListById(long connectionId) {
        return LogFileUtility.getLogFileNameList(connectionId);
    }

    @Override
    public List<Connection> findAllByIds(IdentifiersDTO<Long> ids) {
        return findAllByIds(ids, false);
    }

    @Override
    public List<Connection> findAllByIds(IdentifiersDTO<Long> ids, Boolean includeTest) {
        if (ids == null || CollectionUtils.isEmpty(ids.getIdentifiers())) {
            return Collections.emptyList();
        }

        return excludeTestIfNeeded(connectionRepository.findAllById(ids.getIdentifiers()), includeTest);
    }

    @Override
    public List<ConnectionVersionedDTO> getConnectionVersions(Long connectionId) {
        Connection connection = getById(connectionId);
        List<ConnectionMng> connections = connectionMngService.getAllByConnectionId(connectionId);

        return connections.stream()
                .map(x -> {
                    ConnectionVersionedDTO versionedDTO = new ConnectionVersionedDTO();
                    versionedDTO.setConnectionId(connection.getId());
                    versionedDTO.setTitle(connection.getTitle());
                    versionedDTO.setSnapshotId(x.getId());
                    versionedDTO.setCreatedAt(x.getCreatedAt() != null ? x.getCreatedAt().toEpochMilli() : null);
                    versionedDTO.setCurrent(Objects.equals(connection.getSnapshotId(), x.getId()));
                    versionedDTO.setAuthor(x.getCreatedBy());
                    versionedDTO.setComment(x.getComment());
                    return versionedDTO;
                }).toList();
    }

    @Override
    public void deleteSnapshot(Long connectionId, String snapshotId) {
        Connection connection = getById(connectionId);

        if (Objects.equals(connection.getSnapshotId(), snapshotId)) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.CANT_REMOVE_LAST_VERSION_CONNECTION);
        }

        ConnectionMng connectionMng = connectionMngService.getById(snapshotId);
        ownershipSecurity.checkOwnerOrAdmin(connectionMng);

        connectionMngService.delete(connectionMng);
    }

    @Override
    public void setInitialRevisionToConnections() {
        connectionRepository.updateInitialRevision();
    }

    @Override
    public void updateSnapshot(Long connectionId, String snapshotId, ConnectionVersionUpdateRequest request) {
        if (!existsById(connectionId)) {
            throw new ConnectionNotFoundException(connectionId);
        }

        ConnectionMng connectionMng = connectionMngService.getById(snapshotId);
        ownershipSecurity.checkOwnerOrAdmin(connectionMng);

        connectionMngService.updateSnapshot(connectionMng, request);
    }

    @Override
    public void switchVersion(Long connectionId, String snapshotId) {
        Connection connection = getById(connectionId);
        ConnectionMng connectionMng = connectionMngService.getById(snapshotId);

        connection.setSnapshotId(connectionMng.getId());

        connectionRepository.save(connection);
    }

    /**
     * Full cleanup:
     * 1) find test connection ids in MariaDB
     * 2) delete Mongo docs referencing those ids
     * 3) delete MariaDB rows by ids
     * <p>
     * Idempotent: can be run multiple times safely.
     */
    @Override
    @Transactional
    public CleanupResult cleanupAllTestConnections(Set<Long> runningConnectionIds) {
        log.info("Test connection cleanup started");
        Set<Long> running = runningConnectionIds == null ? Set.of() : runningConnectionIds;

        // exclude connections with a test currently running so an active test is never deleted
        List<Long> ids = connectionRepository.findIdsByTitleLike(TEST_PREFIX_LIKE).stream()
                .filter(id -> !running.contains(id))
                .toList();

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

    /**
     * Returns {@code connections} as-is when {@code includeTest} is true; otherwise drops every test connection
     */
    private List<Connection> excludeTestIfNeeded(List<Connection> connections, Boolean includeTest) {
        if (Boolean.TRUE.equals(includeTest) || connections == null || connections.isEmpty()) {
            return connections;
        }
        return connections.stream()
                .filter(c -> TestNameUtils.isNotTestConnection(c.getTitle()))
                .toList();
    }

    /**
     * Deletes connections by id, tolerating concurrent changes:
     * <ul>
     *   <li>ids that no longer exist are skipped (e.g. a test connection finished and was auto-cleaned
     *       between listing and this call), so a stale id never aborts the whole batch;</li>
     *   <li>a test connection that is currently running (its id present in {@code runningConnectionIds})
     *       is skipped, so an active test in progress is never removed.</li>
     * </ul>
     */
    @Override
    @Transactional
    public void deleteByIds(List<Long> ids, Set<Long> runningConnectionIds) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        Set<Long> running = runningConnectionIds == null ? Set.of() : runningConnectionIds;
        for (Long id : ids) {
            if (id == null) {
                continue;
            }
            Optional<Connection> connection = connectionRepository.findById(id);
            if (connection.isEmpty()) {
                log.info("Skipping deletion of connection id={}: already removed", id);
                continue;
            }
            if (running.contains(id) && TestNameUtils.isTestConnection(connection.get().getTitle())) {
                log.info("Skipping deletion of running test connection id={}", id);
                continue;
            }
            deleteById(id);
        }
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

    public record CleanupResult(int candidateSqlIds, long mongoDeleted, int sqlDeleted) {
    }

    // --------------------------------------------------------------------------------------------------------------------------------------------------------
    // private methods
    // --------------------------------------------------------------------------------------------------------------------------------------------------------

    private String resolveVersion(Connection connection) {
        return connection.getToConnector() == null
                ? ocProps.getVersion()
                : UpdaterVersion.VERSION_4_8.getVersion();
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

        Connection connection = connectionMapper.toEntity(patched);
        connectionRepository.save(connection);

        ConnectionMng connectionMng = connectionMngMapper.toEntity(patched);
        connectionMngService.save(connectionMng);
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