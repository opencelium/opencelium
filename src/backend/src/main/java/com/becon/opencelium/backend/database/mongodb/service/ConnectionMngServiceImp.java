package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService {
    private final ConnectionMngRepository connectionMngRepository;
    private final FieldBindingMngService fieldBindingMngService;
    private final OpenceliumProps ocProps;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            OpenceliumProps ocProps
    ) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.ocProps = ocProps;
    }

    @Override
    public boolean existsByConnectionId(Long id) {
        return connectionMngRepository.existsByConnectionId(id);
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return null;

        if (connectionMng.getConnectionId() != null && existsByConnectionId(connectionMng.getConnectionId())) {
            throw new RuntimeException("CONNECTION_ALREADY_EXISTS");
        }

        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng create(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return null;

        if (connectionMng.getConnectionId() != null && existsByConnectionId(connectionMng.getConnectionId())) {
            throw new RuntimeException("CONNECTION_ALREADY_EXISTS");
        }
        connectionMng.setVersion(ocProps.getVersion());

        populateWithIds(connectionMng, true);

        fieldBindingMngService.bind(connectionMng);

        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng saveDirectly(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return null;

        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public void updateAndBind(ConnectionMng old, ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return;

        populateWithIds(connectionMng);

        fieldBindingMngService.bind(connectionMng);

        connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng getByConnectionId(Long connectionId) {
        return connectionMngRepository.findByConnectionId(connectionId)
                .orElseThrow(() -> new ConnectionNotFoundException(connectionId));
    }

    @Override
    public List<ConnectionMng> getAll() {
        return connectionMngRepository.findAll();
    }

    @Override
    public void updateWithoutBinding(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return;

        if (Objects.isNull(connectionMng.getId()) || !connectionMngRepository.existsById(connectionMng.getId())) {
            throw new RuntimeException("CONNECTION_NOT_FOUND");
        }

        connectionMngRepository.save(connectionMng);
    }

    @Override
    public List<ConnectionMng> getAllById(List<Long> ids) {
        return connectionMngRepository.findAllByConnectionIdIn(ids);
    }

    @Override
    public ConnectionMng delete(Long id) {
        ConnectionMng connectionMng = getByConnectionId(id);
        connectionMngRepository.delete(connectionMng);
        return connectionMng;
    }

    @Override
    public long count() {
        return connectionMngRepository.count();
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
}
