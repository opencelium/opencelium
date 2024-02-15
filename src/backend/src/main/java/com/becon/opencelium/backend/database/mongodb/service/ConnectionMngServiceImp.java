package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.EnhancementMng;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService {
    private final ConnectionMngRepository connectionMngRepository;
    private final FieldBindingMngService fieldBindingMngService;
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;
    private final EnhancementService enhancementService;
    private final MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper;
    private final Mapper<EnhancementMng, EnhancementDTO> enhancementMngMapper;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("methodMngServiceImp") MethodMngService methodMngService,
            @Qualifier("operatorMngServiceImp") OperatorMngService operatorMngService,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
            MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper,
            Mapper<EnhancementMng, EnhancementDTO> enhancementMngMapper
    ) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
        this.enhancementService = enhancementService;
        this.enhancementMapper = enhancementMapper;
        this.enhancementMngMapper = enhancementMngMapper;
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        if (connectionMng == null) return null;
        if (connectionMng.getFromConnector() != null) {
            if (connectionMng.getFromConnector().getMethods() != null) {
                connectionMng.getFromConnector().setMethods(methodMngService.saveAll(connectionMng.getFromConnector().getMethods()));
            }
            if (connectionMng.getFromConnector().getOperators() != null) {
                connectionMng.getFromConnector().setOperators(operatorMngService.saveAll(connectionMng.getFromConnector().getOperators()));
            }
        }
        if (connectionMng.getToConnector() != null) {
            if (connectionMng.getToConnector().getMethods() != null) {
                connectionMng.getToConnector().setMethods(methodMngService.saveAll(connectionMng.getToConnector().getMethods()));
            }
            if (connectionMng.getToConnector().getOperators() != null) {
                connectionMng.getToConnector().setOperators(operatorMngService.saveAll(connectionMng.getToConnector().getOperators()));
            }
        }
        if (connectionMng.getFieldBindings() != null && !connectionMng.getFieldBindings().isEmpty()) {
            connectionMng.setFieldBindings(fieldBindingMngService.saveAll(connectionMng.getFieldBindings()));
        }
        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng saveDirectly(ConnectionMng connectionMng) {
        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng getByConnectionId(Long connectionId) {
        ConnectionMng connectionMng = connectionMngRepository.findByConnectionId(connectionId)
                .orElseThrow(() -> new ConnectionNotFoundException(connectionId));
        setEnhancements(connectionMng);
        return connectionMng;
    }

    @Override
    public List<ConnectionMng> getAll() {
        return connectionMngRepository.findAll();
    }

    @Override
    public List<ConnectionMng> getAllById(List<Long> ids) {
        return connectionMngRepository.findAllByConnectionIdIn(ids);
    }

    @Override
    public void delete(Long id) {
        ConnectionMng connectionMng = getByConnectionId(id);
        if (connectionMng.getFromConnector() != null) {
            if (connectionMng.getFromConnector().getMethods() != null)
                methodMngService.deleteAll(connectionMng.getFromConnector().getMethods());
            if (connectionMng.getFromConnector().getOperators() != null)
                operatorMngService.deleteAll(connectionMng.getFromConnector().getOperators());
        }
        if (connectionMng.getToConnector() != null) {
            if (connectionMng.getToConnector().getMethods() != null)
                methodMngService.deleteAll(connectionMng.getToConnector().getMethods());

            if (connectionMng.getToConnector().getOperators() != null)
                operatorMngService.deleteAll(connectionMng.getToConnector().getOperators());
        }
        if (connectionMng.getFieldBindings() != null)
            fieldBindingMngService.deleteAll(connectionMng.getFieldBindings());
        connectionMngRepository.delete(connectionMng);
    }

    @Override
    public long count() {
        return connectionMngRepository.count();
    }

    @Override
    public void doWithPatchedConnection(ConnectionDTO connectionDTO, ConnectionDTO patched, PatchConnectionDetails details) {
        for (PatchConnectionDetails.PatchOperationDetail opDetail : details.getOpDetails()) {
            if (opDetail.isItEnh()) {
                fieldBindingMngService.doWithPatchedEnhancement(connectionDTO, patched, opDetail);
            } else if (opDetail.isItMethod()) {
                if (opDetail.isFrom()) {
                    methodMngService.doWithPatchedMethod(connectionDTO.getFromConnector(), patched.getFromConnector(), opDetail);
                } else {
                    methodMngService.doWithPatchedMethod(connectionDTO.getToConnector(), patched.getToConnector(), opDetail);
                }
            } else if (opDetail.isItOperator()) {
                if (opDetail.isFrom()) {
                    operatorMngService.doWithPatchedOperator(connectionDTO.getFromConnector(), patched.getFromConnector(), opDetail);
                } else {
                    operatorMngService.doWithPatchedOperator(connectionDTO.getToConnector(), patched.getToConnector(), opDetail);
                }
            }
        }
    }

    private void setEnhancements(ConnectionMng connection) {
        if (connection.getFieldBindings() == null || connection.getFieldBindings().isEmpty())
            return;
        connection.getFieldBindings().forEach(f -> f.setEnhancement(enhancementMngMapper.toEntity(enhancementMapper.toDTO(enhancementService.getById(f.getEnhancementId())))));
    }
}
