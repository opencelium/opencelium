package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.constant.PathConstant;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.database.mysql.service.ConnectorService;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.invoker.service.InvokerService;
import com.becon.opencelium.backend.mapper.mongo.ConnectionMngMapper;
import com.becon.opencelium.backend.resource.connection.ConnectionVersionUpdateRequest;
import com.becon.opencelium.backend.versionmanager.EntityUpdater;
import com.becon.opencelium.backend.versionmanager.EntityVersionManager;
import org.apache.commons.lang3.StringUtils;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService {
    private static final Logger log = LoggerFactory.getLogger(ConnectionMngServiceImp.class);

    private final ConnectionMngRepository connectionMngRepository;
    private final FieldBindingMngService fieldBindingMngService;
    private final OpenceliumProps ocProps;
    private final ConnectionMngMapper connectionMngMapper;
    private final EntityUpdater<ConnectionMng> connectionMngEntityUpdater;
    private final OperatorMngService operatorMngService;
    private final ConnectorService connectorService;
    private final InvokerService invokerService;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            OpenceliumProps ocProps,
            ConnectionMngMapper connectionMngMapper,
            EntityVersionManager entityVersionManager,
            OperatorMngService operatorMngService,
            ConnectorService connectorService,
            InvokerService invokerService) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.ocProps = ocProps;
        this.connectionMngMapper = connectionMngMapper;
        this.connectionMngEntityUpdater = entityVersionManager.getUpdater(ConnectionMng.class);
        this.operatorMngService = operatorMngService;
        this.connectorService = connectorService;
        this.invokerService = invokerService;
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return null;

        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng create(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return null;

        validate(connectionMng);

        connectionMng.setVersion(ocProps.getVersion());
        connectionMng.setId(null);

        populateWithIds(connectionMng, true);

        fieldBindingMngService.bind(connectionMng);

        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public List<ConnectionMng> getAll() {
        List<ConnectionMng> all = connectionMngRepository.findAll();
        all.forEach(this::applyVersionUpdater);
        return all;
    }

    @Override
    public ConnectionMng delete(String id) {
        ConnectionMng connectionMng = getById(id);
        connectionMngRepository.delete(connectionMng);
        return connectionMng;
    }

    @Override
    public void delete(ConnectionMng connectionMng) {
        connectionMngRepository.delete(connectionMng);
    }

    @Override
    public long count() {
        return connectionMngRepository.count();
    }

    @Override
    public ConnectionMng getById(String id) {
        ConnectionMng connectionMng = connectionMngRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CONNECTION_NOT_FOUND"));
        applyVersionUpdater(connectionMng);
        return connectionMng;
    }

    @Override
    public List<ConnectionMng> getAllByConnectionId(Long id) {
        List<ConnectionMng> all = connectionMngRepository.findAllByConnectionIdOrderByConnectionIdDesc(id);
        all.forEach(this::applyVersionUpdater);
        return all;
    }

    @Override
    public List<ConnectionMng> getAllByConnectionIdRaw(Long id) {
        return connectionMngRepository.findAllByConnectionIdOrderByConnectionIdDesc(id);
    }

    /**
     * Migrates the in-memory ConnectionMng to the running OpenCelium version without persisting the change.
     * The DB document stays at its original version; conversion happens only on the read path.
     */
    private void applyVersionUpdater(ConnectionMng connectionMng) {
        if (connectionMng == null) return;
        try {
            connectionMngEntityUpdater.updateToCurrentVersion(connectionMng);
        } catch (Exception e) {
            log.error("Failed to convert ConnectionMng[id={}, version={}] to current version on read",
                    connectionMng.getId(), connectionMng.getVersion(), e);
        }
    }

    @Override
    public long deleteByConnectionIdIn(List<Long> chunk) {
        return connectionMngRepository.deleteByConnectionIdIn(chunk);
    }

    @Override
    public void deleteAllByConnectionId(Long id) {
        connectionMngRepository.deleteAllByConnectionId(id);
    }

    @Override
    public void updateSnapshot(ConnectionMng connection, ConnectionVersionUpdateRequest request) {
        connectionMngMapper.updateFrom(connection, request);

        connectionMngRepository.save(connection);
    }

    private void populateWithIds(ConnectionMng connectionMng) {
        populateWithIds(connectionMng, false);
    }

    private void populateWithIds(ConnectionMng connectionMng, boolean replaceable) {
        if (connectionMng.getFromConnector() != null) {
            if (connectionMng.getFromConnector().getMethods() != null) {
                for (MethodMng method : connectionMng.getFromConnector().getMethods()) {
                    if (method.getId() == null || replaceable) {
                        method.setId(ObjectId.get().toHexString());
                    }
                }
            }

            if (connectionMng.getFromConnector().getOperators() != null) {
                for (OperatorMng operator : connectionMng.getFromConnector().getOperators()) {
                    if (operator.getId() == null || replaceable) {
                        operator.setId(ObjectId.get().toHexString());
                    }
                }
            }
        }

        if (connectionMng.getToConnector() != null) {
            if (connectionMng.getToConnector().getMethods() != null) {
                for (MethodMng method : connectionMng.getToConnector().getMethods()) {
                    if (method.getId() == null || replaceable) {
                        method.setId(ObjectId.get().toHexString());
                    }
                }
            }

            if (connectionMng.getToConnector().getOperators() != null) {
                for (OperatorMng operator : connectionMng.getToConnector().getOperators()) {
                    if (operator.getId() == null || replaceable) {
                        operator.setId(ObjectId.get().toHexString());
                    }
                }
            }
        }

        if (connectionMng.getFieldBindings() != null) {
            for (FieldBindingMng fieldBindingMng : connectionMng.getFieldBindings()) {
                if (fieldBindingMng.getId() == null || replaceable) {
                    fieldBindingMng.setId(ObjectId.get().toHexString());
                }
            }
        }
    }

    private void validate(ConnectionMng connectionMng) {
        if (connectionMng.getFromConnector() != null && connectionMng.getFromConnector().getMethods() != null) {
            validateMethods(connectionMng.getFromConnector().getMethods());
        }

        if (connectionMng.getToConnector() != null && connectionMng.getToConnector().getMethods() != null) {
            validateMethods(connectionMng.getToConnector().getMethods());
        }

        if (connectionMng.getFromConnector() != null && connectionMng.getFromConnector().getOperators() != null) {
            validateOperators(connectionMng.getFromConnector().getOperators());
        }

        if (connectionMng.getToConnector() != null && connectionMng.getToConnector().getOperators() != null) {
            validateOperators(connectionMng.getToConnector().getOperators());
        }
    }

    private void validateOperators(List<OperatorMng> operators) {
        for (OperatorMng operator : operators) {
            operatorMngService.validate(operator);
        }
    }

    private void validateMethods(List<MethodMng> methods) {
        for (MethodMng method : methods) {
            validateMethod(method);
        }
    }

    private void validateMethod(MethodMng method) {
        if (StringUtils.isBlank(method.getName())) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, ExceptionMessages.METHOD_NAME_MUST_BE_NON_NULL);
        }

        validateMethodConnector(method);
    }

    /**
     * Validates the connector reference carried by a single method before the connection is persisted.
     */
    private void validateMethodConnector(MethodMng method) {
        MethodConnectorMng connector = method.getConnector();

        // No connector: this is a plain HTTP request / webhook method, nothing to validate.
        if (connector == null) {
            return;
        }

        // A connector reference is present but nameless — it cannot be resolved to a real connector.
        if (connector.getConnectorId() == null) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    String.format(ExceptionMessages.METHOD_CONNECTOR_REQUIRED, method.getName(), method.getIndex()));
        }

        Optional<Connector> connectorOpt = connectorService.findById(connector.getConnectorId());

        // The referenced connector id does not exist locally.
        if (connectorOpt.isEmpty()) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    String.format(ExceptionMessages.METHOD_CONNECTOR_NOT_FOUND, connector.getConnectorId(), method.getName(), method.getIndex()));
        }

        String invoker = connector.getInvoker();

        // The invoker must be loaded in the container; if it is missing the user has to drop its XML into
        // PathConstant.INVOKER and restart, which is what the error message tells them.
        if (invoker == null || !invokerService.existsByName(invoker)) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    String.format(ExceptionMessages.METHOD_INVOKER_NOT_FOUND, invoker, method.getName(), method.getIndex(), PathConstant.INVOKER));
        }

        // Both sides exist but disagree: the method's invoker must be the one the chosen connector runs on,
        // otherwise the connection would execute against a different invoker than the connector defines.
        if (!Objects.equals(connectorOpt.get().getInvoker(), invoker)) {
            throw new GeneralServiceException(
                    ExceptionConstant.INVALID_DATA,
                    String.format(ExceptionMessages.METHOD_INVOKER_AND_CONNECTOR_NOT_MATCH, invoker, connectorOpt.get().getInvoker(), method.getName(), method.getIndex()));
        }
    }
}
