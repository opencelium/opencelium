package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
import com.becon.opencelium.backend.resource.PatchConnectionDetails;
import com.becon.opencelium.backend.resource.connection.ConnectionDTO;
import com.becon.opencelium.backend.resource.connection.binding.EnhancementDTO;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.fge.jsonpatch.JsonPatch;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService {
    private final ConnectionMngRepository connectionMngRepository;
    private final FieldBindingMngService fieldBindingMngService;
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;
    private final PatchHelper patchHelper;
    private final ObjectMapper objectMapper;
    private final EnhancementService enhancementService;
    private final MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper;
    private final Mapper<EnhancementMng, EnhancementDTO> enhancementMngMapper;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("methodMngServiceImp") MethodMngService methodMngService,
            @Qualifier("operatorMngServiceImp") OperatorMngService operatorMngService,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
            PatchHelper patchHelper,
            ObjectMapper objectMapper,
            MapperUpdatable<Enhancement, EnhancementDTO> enhancementMapper,
            Mapper<EnhancementMng, EnhancementDTO> enhancementMngMapper
    ) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
        this.patchHelper = patchHelper;
        this.objectMapper = objectMapper;
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
    public String patchMethodOrOperator(Long connectionId, Integer connectorId, JsonPatch patch) {
        ConnectionMng connection = getByConnectionId(connectionId);

        String id = null;
        if (connection.getFromConnector() != null && connectorId.equals(connection.getFromConnector().getConnectorId())) {
            if (connection.getFromConnector().getMethods() == null) {
                connection.getFromConnector().setMethods(new ArrayList<>());
            }
            if (connection.getFromConnector().getOperators() == null) {
                connection.getFromConnector().setOperators(new ArrayList<>());
            }
            ConnectorMng fromConnector = connection.getFromConnector();
            ConnectorMng patched = patchHelper.patch(patch, connection.getFromConnector(), ConnectorMng.class);
            connection.setFromConnector(patched);
            id = doAfterPatchBeforeSave(fromConnector, patched, patch);
        } else if (connection.getToConnector() != null && connectorId.equals(connection.getToConnector().getConnectorId())) {
            if (connection.getToConnector().getMethods() == null) {
                connection.getToConnector().setMethods(new ArrayList<>());
            }
            if (connection.getToConnector().getOperators() == null) {
                connection.getToConnector().setOperators(new ArrayList<>());
            }
            ConnectorMng toConnector = connection.getToConnector();
            ConnectorMng patched = patchHelper.patch(patch, connection.getToConnector(), ConnectorMng.class);
            connection.setToConnector(patched);
            id = doAfterPatchBeforeSave(toConnector, patched, patch);
        }

        connectionMngRepository.save(connection);
        return id;
    }

    @Override
    public List<ConnectionMng> getAllById(List<Long> ids) {
        return connectionMngRepository.findAllByConnectionIdIn(ids);
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

    private String doAfterPatchBeforeSave(ConnectorMng connector, ConnectorMng patched, JsonPatch patch) {
        String res = null;
        String lastModifiedId = null;
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            String op = next.get("op").textValue();

            if (path.matches("/methods/\\d+.*") || path.matches("/methods/-.*")) {
                if (path.matches("/methods/\\d+/.+") || path.matches("/methods/-/.+")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(connector.getMethods(), strIdx);
                    MethodMng toModify = patched.getMethods().get(index);
                    methodMngService.save(toModify);
                    lastModifiedId = toModify.getId();
                } else if (op.equals("remove")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(connector.getMethods(), strIdx);
                    MethodMng toRemove = connector.getMethods().get(index);
                    methodMngService.deleteById(toRemove.getId());
                    res = toRemove.getId();
                } else if (op.equals("add") || op.equals("replace")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(patched.getMethods(), strIdx);
                    MethodMng toAdd = patched.getMethods().get(index);
                    MethodMng saved = methodMngService.save(toAdd);
                    res = saved.getId();
                }
            } else if (path.matches("/operators/\\d+.*") || path.matches("/operators/-.*")) {
                if (path.matches("/operators/\\d+/.+") || path.matches("/operators/-/.+")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(connector.getOperators(), strIdx);
                    OperatorMng toModify = patched.getOperators().get(index);
                    operatorMngService.save(toModify);
                    lastModifiedId = toModify.getId();
                } else if (op.equals("remove")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(connector.getOperators(), strIdx);
                    OperatorMng toRemove = connector.getOperators().get(index);
                    operatorMngService.deleteById(toRemove.getId());
                    res = toRemove.getId();
                } else if (op.equals("add") || op.equals("replace")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(patched.getOperators(), strIdx);
                    OperatorMng toAdd = patched.getOperators().get(index);
                    OperatorMng saved = operatorMngService.save(toAdd);
                    res = saved.getId();
                }
            } else if (path.matches("/methods") && op.equals("replace")) {
                JsonNode value = next.get("value");
                if (value.isNull()) {
                    List<MethodMng> methods = connector.getMethods();
                    methodMngService.deleteAll(methods);
                }
            } else if (path.matches("/operators") && op.equals("replace")) {
                JsonNode value = next.get("value");
                if (value.isNull()) {
                    List<OperatorMng> operators = connector.getOperators();
                    operatorMngService.deleteAll(operators);
                }
            }
        }
        return res == null ? lastModifiedId : res;
    }

    private <T> int findIndexOf(List<T> list, String index) {
        if (index.equals("-"))
            return list.size() - 1;

        return Integer.parseInt(index);
    }
}
