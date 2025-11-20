package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.props.OpenceliumProps;
import com.becon.opencelium.backend.database.mongodb.dao.ConnectionMngDAO;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.exception.GeneralServiceException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.resource.connection.v5.MapperDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.partialconnection.FlowchartCreateRequest;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.github.fge.jsonpatch.JsonPatch;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService {
    private final ConnectionMngRepository connectionMngRepository;
    private final FieldBindingMngService fieldBindingMngService;
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;
    private final OpenceliumProps ocProps;
    private final ConnectionMngDAO connectionMngDAO;
    private final Mapper<MethodMng, MethodDTO> methodMngMapper;
    private final Mapper<OperatorMng, OperatorDTO> operatorMngMapper;
    private final Mapper<MapperMng, MapperDTO> mapperMapper;
    private final MapperMngService mapperMngService;
    private final PatchHelper patchHelper;
    private final ExecutionPlanService executionPlanService;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("methodMngServiceImp") MethodMngService methodMngService,
            @Qualifier("operatorMngServiceImp") OperatorMngService operatorMngService,
            OpenceliumProps ocProps,
            ConnectionMngDAO connectionMngDAO,
            Mapper<MethodMng, MethodDTO> methodMngMapper,
            Mapper<OperatorMng, OperatorDTO> operatorMngMapper,
            Mapper<MapperMng, MapperDTO> mapperMapper, MapperMngService mapperMngService, PatchHelper patchHelper, ExecutionPlanService executionPlanService
    ) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
        this.ocProps = ocProps;
        this.connectionMngDAO = connectionMngDAO;
        this.methodMngMapper = methodMngMapper;
        this.operatorMngMapper = operatorMngMapper;
        this.mapperMapper = mapperMapper;
        this.mapperMngService = mapperMngService;
        this.patchHelper = patchHelper;
        this.executionPlanService = executionPlanService;
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
        connectionMng.setVersion(ocProps.getVersion());
        try {
            fieldBindingMngService.bind(connectionMng); // also saves to db
            if (connectionMng.getFromConnector() != null) {
                if (connectionMng.getFromConnector().getMethods() != null) {

                    // Set Id to null to ensure a new method is created instead of updating an existing one with the same Id
                    connectionMng.getFromConnector().getMethods().forEach(method -> method.setId(null));

                    connectionMng.getFromConnector().setMethods(methodMngService.saveAll(connectionMng.getFromConnector().getMethods()));
                }
                if (connectionMng.getFromConnector().getOperators() != null) {

                    // Set Id to null to ensure a new operator is created instead of updating an existing one with the same Id
                    connectionMng.getFromConnector().getOperators().forEach(op -> op.setId(null));

                    connectionMng.getFromConnector().setOperators(operatorMngService.saveAll(connectionMng.getFromConnector().getOperators()));
                }
            }
            if (connectionMng.getToConnector() != null) {
                if (connectionMng.getToConnector().getMethods() != null) {

                    // Set Id to null to ensure a new method is created instead of updating an existing one with the same Id
                    connectionMng.getToConnector().getMethods().forEach(method -> method.setId(null));

                    connectionMng.getToConnector().setMethods(methodMngService.saveAll(connectionMng.getToConnector().getMethods()));
                }
                if (connectionMng.getToConnector().getOperators() != null) {

                    // Set Id to null to ensure a new operator is created instead of updating an existing one with the same Id
                    connectionMng.getToConnector().getOperators().forEach(op -> op.setId(null));

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
        if (Objects.isNull(connectionMng)) return null;

        return connectionMngRepository.save(connectionMng);
    }

    @Override
    public ConnectionMng getByConnectionId(Long connectionId) {
        ConnectionMng connectionMng = connectionMngRepository.findByConnectionId(connectionId)
                .orElseThrow(() -> new ConnectionNotFoundException(connectionId));

        return connectionMng;
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
        try {
            if (Objects.nonNull(connectionMng.getFromConnector())) {
                if (Objects.nonNull(connectionMng.getFromConnector().getMethods())) {
                    connectionMng.getFromConnector().setMethods(methodMngService.saveAll(connectionMng.getFromConnector().getMethods()));
                }
                if (Objects.nonNull(connectionMng.getFromConnector().getOperators())) {
                    connectionMng.getFromConnector().setOperators(operatorMngService.saveAll(connectionMng.getFromConnector().getOperators()));
                }
            }
            if (Objects.nonNull(connectionMng.getToConnector())) {
                if (Objects.nonNull(connectionMng.getToConnector().getMethods())) {
                    connectionMng.getToConnector().setMethods(methodMngService.saveAll(connectionMng.getToConnector().getMethods()));
                }
                if (Objects.nonNull(connectionMng.getToConnector().getOperators())) {
                    connectionMng.getToConnector().setOperators(operatorMngService.saveAll(connectionMng.getToConnector().getOperators()));
                }
            }
            if (Objects.nonNull(connectionMng.getFieldBindings())) {
                fieldBindingMngService.saveAll(connectionMng.getFieldBindings());
            }
        } catch (Exception e) {
            deleteChildren(connectionMng);
            throw e;
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
        deleteChildren(connectionMng);
        connectionMngRepository.delete(connectionMng);
        return connectionMng;
    }

    @Override
    public long count() {
        return connectionMngRepository.count();
    }

    @Override
    public void createNewConnection(Long connectionId) {
        ConnectionMng connectionMng = new ConnectionMng();
        connectionMng.setConnectionId(connectionId);
        connectionMng.setVersion(ocProps.getVersion());
        connectionMng.setExecutionPlan(executionPlanService.initNew());

        connectionMngRepository.save(connectionMng);
    }

    @Override
    public String addFlowchart(FlowchartCreateRequest request) {
        FlowchartMng flowchartMng = connectionMngDAO.addFlowchart(request);

        return flowchartMng.getFlowId();
    }

    @Override
    public MethodDTO addMethod(Long connectionId, String flowId, MethodDTO method) {
        MethodMng methodToSave = methodMngMapper.toEntity(method);

        MethodMng savedMethod = connectionMngDAO.pushNewMethod(connectionId, flowId, methodToSave);

        return methodMngMapper.toDTO(savedMethod);
    }

    @Override
    public MethodDTO updateMethod(Long connectionId, String flowId, MethodDTO method) {
        if (method.getId() == null) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "METHOD_ID_NULL");
        }

        connectionMngDAO.checkConnection(connectionId);

        connectionMngDAO.checkFlowchart(connectionId, flowId);

        MethodMng methodToUpdate = methodMngMapper.toEntity(method);

        MethodMng oldMethod = methodMngService.getById(method.getId());
        methodToUpdate.setRevision(oldMethod.getRevision());

        methodMngService.save(methodToUpdate);

        return methodMngMapper.toDTO(methodToUpdate);
    }

    @Override
    public MethodDTO updateMethod(Long connectionId, String flowId, String methodId, JsonPatch patch) {
        connectionMngDAO.checkConnection(connectionId);

        connectionMngDAO.checkFlowchart(connectionId, flowId);

        MethodMng method = methodMngService.getById(methodId);
        MethodMng patched = patchHelper.patch(patch, method, MethodMng.class);

        methodMngService.save(patched);

        return methodMngMapper.toDTO(patched);
    }

    @Override
    public void deleteMethod(Long connectionId, String flowId, String methodId) {
        connectionMngDAO.removeMethod(connectionId, flowId, methodId);
    }

    @Override
    public OperatorDTO addOperator(Long connectionId, String flowId, OperatorDTO operator) {
        OperatorMng operatorToSave = operatorMngMapper.toEntity(operator);

        OperatorMng saved = connectionMngDAO.pushNewOperator(connectionId, flowId, operatorToSave);

        return operatorMngMapper.toDTO(saved);
    }

    @Override
    public OperatorDTO updateOperator(Long connectionId, String flowId, OperatorDTO operator) {
        if (operator.getId() == null) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "OPERATOR_ID_NULL");
        }

        connectionMngDAO.checkConnection(connectionId);

        connectionMngDAO.checkFlowchart(connectionId, flowId);

        OperatorMng operatorToUpdate = operatorMngMapper.toEntity(operator);

        OperatorMng oldOperator = operatorMngService.getById(operator.getId());
        operatorToUpdate.setRevision(oldOperator.getRevision());

        operatorMngService.save(operatorToUpdate);

        return operatorMngMapper.toDTO(operatorToUpdate);
    }

    @Override
    public OperatorDTO updateOperator(Long connectionId, String flowId, String operatorId, JsonPatch patch) {
        connectionMngDAO.checkConnection(connectionId);

        connectionMngDAO.checkFlowchart(connectionId, flowId);

        OperatorMng operator = operatorMngService.getById(operatorId);
        OperatorMng patched = patchHelper.patch(patch, operator, OperatorMng.class);

        operatorMngService.save(patched);

        return operatorMngMapper.toDTO(patched);
    }

    @Override
    public void deleteOperator(Long connectionId, String flowId, String operatorId) {
        connectionMngDAO.removeOperator(connectionId, flowId, operatorId);
    }

    @Override
    public MapperDTO addMapper(Long connectionId, MapperDTO fieldBinding) {
        MapperMng mapper = mapperMapper.toEntity(fieldBinding);

        ExecutionPlanMng executionPlan = executionPlanService.reorderSteps(connectionId, mapper, false);

        MapperMng savedMapper = connectionMngDAO.pushNewMapperAndUpdatePlan(connectionId, mapper, executionPlan);

        return mapperMapper.toDTO(savedMapper);
    }

    @Override
    public MapperDTO updateMapper(Long connectionId, MapperDTO mapperDTO) {
        if (mapperDTO.getId() == null) {
            throw new GeneralServiceException(ExceptionConstant.INVALID_DATA, "MAPPER_ID_NULL");
        }

        connectionMngDAO.checkConnection(connectionId);

        MapperMng mapperToUpdate = mapperMapper.toEntity(mapperDTO);
        MapperMng mapper = mapperMngService.getById(mapperToUpdate.getId());
        mapperToUpdate.setRevision(mapper.getRevision());

        executionPlanService.reorderSteps(connectionId, mapper, true);

        mapperMngService.save(mapperToUpdate);

        return mapperMapper.toDTO(mapperToUpdate);
    }

    @Override
    public MapperDTO updateMapper(Long connectionId, String fbId, JsonPatch patch) {
        connectionMngDAO.checkConnection(connectionId);

        MapperMng mapperMng = mapperMngService.getById(fbId);
        MapperMng patched = patchHelper.patch(patch, mapperMng, MapperMng.class);

        executionPlanService.reorderSteps(connectionId, patched, true);

        mapperMngService.save(patched);

        return mapperMapper.toDTO(patched);
    }

    @Override
    public void deleteMapper(Long connectionId, String fbId) {
        connectionMngDAO.removeMapper(connectionId, fbId);
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
}
