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
import java.util.function.BiFunction;
import java.util.function.Consumer;

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
    public boolean existsByConnectionId(Long id) {
        return connectionMngRepository.existsByConnectionId(id);
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        if (connectionMng == null){
            return null;
        }
        if (connectionMng.getConnectionId() != null && existsByConnectionId(connectionMng.getConnectionId())) {
            throw new RuntimeException("CONNECTION_ALREADY_EXISTS");
        }
        try {
            fieldBindingMngService.bind(connectionMng); // also saves to db
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
        } catch (Exception e) {
            deleteChildren(connectionMng);
            throw e;
        }
        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng saveDirectly(ConnectionMng connectionMng) {
        if (connectionMng == null){
            return null;
        }
        if (connectionMng.getConnectionId() != null && existsByConnectionId(connectionMng.getConnectionId())) {
            throw new RuntimeException("CONNECTION_ALREADY_EXISTS");
        }
        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public void updateAndBind(ConnectionMng old, ConnectionMng connectionMng) {
        if (connectionMng == null)
            return;

        try {
            updateWithoutRollback(old, connectionMng);
        } catch (Exception e) {
            updateWithoutRollback(connectionMng, old);
            throw e;
        }
        try {
            fieldBindingMngService.bindAfterUpdate(connectionMng);
        } catch (Exception e) {
            fieldBindingMngService.bindAfterUpdate(old);
            updateWithoutRollback(connectionMng, old);
            throw e;
        }
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
    public ConnectionMng delete(Long id) {
        ConnectionMng connectionMng = getByConnectionId(id);
        deleteChildren(connectionMng);
        connectionMngRepository.delete(connectionMng);
        return connectionMng;
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

    private void updateWithoutRollback(ConnectionMng old, ConnectionMng connectionMng) {
        if (connectionMng.getFromConnector() != null) {
            if (connectionMng.getFromConnector().getMethods() != null) {
                methodMngService.saveAll(connectionMng.getFromConnector().getMethods());
                doIfNoneMatch(
                        old.getFromConnector().getMethods(),
                        connectionMng.getFromConnector().getMethods(),
                        (m1, m2) -> m1.getId().equals(m2.getId()),
                        methodMngService::delete
                );
            } else if (old.getFromConnector() != null && old.getFromConnector().getMethods() != null) {
                methodMngService.deleteAll(old.getFromConnector().getMethods());
            }

            if (connectionMng.getFromConnector().getOperators() != null) {
                operatorMngService.saveAll(connectionMng.getFromConnector().getOperators());
                doIfNoneMatch(
                        old.getFromConnector().getOperators(),
                        connectionMng.getFromConnector().getOperators(),
                        (o1, o2) -> o1.getId().equals(o2.getId()),
                        operatorMngService::delete
                );
            } else if (old.getFromConnector() != null && old.getFromConnector().getOperators() != null) {
                operatorMngService.deleteAll(old.getFromConnector().getOperators());
            }
        } else if (old.getFromConnector() != null) {
            if (old.getFromConnector().getMethods() != null) {
                methodMngService.deleteAll(old.getFromConnector().getMethods());
            }
            if (old.getFromConnector().getOperators() != null) {
                operatorMngService.deleteAll(old.getFromConnector().getOperators());
            }
        }

        if (connectionMng.getToConnector() != null) {
            if (connectionMng.getToConnector().getMethods() != null) {
                methodMngService.saveAll(connectionMng.getToConnector().getMethods());
                doIfNoneMatch(
                        old.getToConnector().getMethods(),
                        connectionMng.getToConnector().getMethods(),
                        (m1, m2) -> m1.getId().equals(m2.getId()),
                        methodMngService::delete
                );
            } else if (old.getToConnector() != null && old.getToConnector().getMethods() != null) {
                methodMngService.deleteAll(old.getToConnector().getMethods());
            }
            if (connectionMng.getToConnector().getOperators() != null) {
                operatorMngService.saveAll(connectionMng.getToConnector().getOperators());
                doIfNoneMatch(
                        old.getToConnector().getOperators(),
                        connectionMng.getToConnector().getOperators(),
                        (o1, o2) -> o1.getId().equals(o2.getId()),
                        operatorMngService::delete
                );
            } else if (old.getToConnector() != null && old.getToConnector().getOperators() != null) {
                operatorMngService.deleteAll(old.getToConnector().getOperators());
            }
        } else if (old.getToConnector() != null) {
            if (old.getToConnector().getMethods() != null) {
                methodMngService.deleteAll(old.getToConnector().getMethods());
            }
            if (old.getToConnector().getOperators() != null) {
                operatorMngService.deleteAll(old.getToConnector().getOperators());
            }
        }

        if (connectionMng.getFieldBindings() != null && !connectionMng.getFieldBindings().isEmpty()) {
            fieldBindingMngService.saveAll(connectionMng.getFieldBindings());
            doIfNoneMatch(
                    old.getFieldBindings(),
                    connectionMng.getFieldBindings(),
                    (f1, f2) -> f1.getId().equals(f2.getId()),
                    fieldBindingMngService::delete
            );
        } else if (old.getFieldBindings() != null) {
            fieldBindingMngService.deleteAll(old.getFieldBindings());
        }
        connectionMngRepository.save(connectionMng);
    }

    private void deleteChildren(ConnectionMng connectionMng) {
        if (connectionMng.getFromConnector() != null) {
            if (connectionMng.getFromConnector().getMethods() != null)
                methodMngService.deleteAll(connectionMng.getFromConnector().getMethods()
                        .stream()
                        .filter(m -> m.getId() != null)
                        .toList());
            if (connectionMng.getFromConnector().getOperators() != null)
                operatorMngService.deleteAll(connectionMng.getFromConnector().getOperators()
                        .stream()
                        .filter(o -> o.getId() != null)
                        .toList());
        }
        if (connectionMng.getToConnector() != null) {
            if (connectionMng.getToConnector().getMethods() != null)
                methodMngService.deleteAll(connectionMng.getToConnector().getMethods()
                        .stream()
                        .filter(m -> m.getId() != null)
                        .toList());

            if (connectionMng.getToConnector().getOperators() != null)
                operatorMngService.deleteAll(connectionMng.getToConnector().getOperators()
                        .stream()
                        .filter(o -> o.getId() != null)
                        .toList());
        }
        if (connectionMng.getFieldBindings() != null)
            fieldBindingMngService.deleteAll(connectionMng.getFieldBindings()
                    .stream()
                    .filter(f -> f.getId() != null)
                    .toList());
    }

    private void setEnhancements(ConnectionMng connection) {
        if (connection.getFieldBindings() == null || connection.getFieldBindings().isEmpty())
            return;
        connection.getFieldBindings().forEach(f -> f.setEnhancement(enhancementMngMapper.toEntity(enhancementMapper.toDTO(enhancementService.getById(f.getEnhancementId())))));
    }

    private <T> void doIfNoneMatch(List<T> olds, List<T> news, BiFunction<T, T, Boolean> f, Consumer<T> c) {
        if (olds != null) for (T t : olds) if (news.stream().noneMatch(x -> f.apply(x, t))) c.accept(t);
    }
}
