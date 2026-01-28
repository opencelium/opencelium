package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.exception.ConnectionValidationException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
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
    public ConnectionMng save(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return null;

        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng create(ConnectionMng connectionMng) {
        if (Objects.isNull(connectionMng)) return null;

        connectionMng.setVersion(ocProps.getVersion());
        connectionMng.setId(null);

        populateWithIds(connectionMng, true);

        fieldBindingMngService.bind(connectionMng);

        return connectionMngRepository.save(connectionMng);
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
    public ConnectionMng delete(String id) {
        ConnectionMng connectionMng = getById(id);
        connectionMngRepository.delete(connectionMng);
        return connectionMng;
    }

    @Override
    public long count() {
        return connectionMngRepository.count();
    }

    @Override
    public ConnectionMng getById(String id) {
        return connectionMngRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CONNECTION_NOT_FOUND"));
    }

    @Override
    public List<ConnectionMng> getAllByConnectionId(Long id) {
        return connectionMngRepository.findAllByConnectionIdOrderByConnectionIdDesc(id);
    }

    @Override
    public long deleteByConnectionIdIn(List<Long> chunk) {
        return connectionMngRepository.deleteByConnectionIdIn(chunk);
    }

    @Override
    public void deleteAllByConnectionId(Long id) {
        connectionMngRepository.deleteAllByConnectionId(id);
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
