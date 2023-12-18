package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mysql.entity.Connection;
import com.becon.opencelium.backend.database.mysql.entity.Enhancement;
import com.becon.opencelium.backend.database.mysql.service.EnhancementService;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.mapper.base.Mapper;
import com.becon.opencelium.backend.mapper.base.MapperUpdatable;
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
import java.util.Objects;

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
            PatchHelper patchHelper,
            ObjectMapper objectMapper,
            @Qualifier("enhancementServiceImp") EnhancementService enhancementService,
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
        return connectionMngRepository.findByConnectionId(connectionId)
                .orElseThrow(() -> new ConnectionNotFoundException(connectionId));
    }

    @Override
    public List<ConnectionMng> getAll() {
        return connectionMngRepository.findAll();
    }

    @Override
    public void delete(Long id) {
        connectionMngRepository.delete(getByConnectionId(id));
    }

    @Override
    public String patchMethodOrOperator(Long connectionId, Integer connectorId, JsonPatch patch) {
        ConnectionMng connection = getByConnectionId(connectionId);

        String id;
        if (connectorId.equals(connection.getFromConnector().getConnectorId())) {
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
        } else {
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
    public FieldBindingMng patchUpdate(Long connectionId, JsonPatch patch) {
        ConnectionMng connection = getByConnectionId(connectionId);
        if (connection.getFieldBindings() == null) {
            connection.setFieldBindings(new ArrayList<>());
        }

        ConnectionMng patched = patchHelper.patch(patch, connection, ConnectionMng.class);

        FieldBindingMng FB = doAfterPatchBeforeSaveEnhancement(connection, patched, patch);
        connectionMngRepository.save(patched);
        return FB;
    }

    private FieldBindingMng doAfterPatchBeforeSaveEnhancement(ConnectionMng connection, ConnectionMng patched, JsonPatch patch) {
        FieldBindingMng res = null;
        FieldBindingMng lastModified = null;
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            String op = next.get("op").textValue();
            if (path.startsWith("/fieldBindings")) {
                if (path.matches("/fieldBindings/\\d+/.+") || path.matches("/fieldBindings/-/.+")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(patched.getFieldBindings(), strIdx);
                    FieldBindingMng toModify = patched.getFieldBindings().get(index);
                    Enhancement enhancement = enhancementService.getById(toModify.getEnhancementId());
                    enhancementMapper.updateEntityFromDto(enhancement, enhancementMngMapper.toDTO(toModify.getEnhancement()));
                    enhancementService.save(enhancement);
                    fieldBindingMngService.save(toModify);
                    lastModified = toModify;
                } else if (op.equals("remove")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(connection.getFieldBindings(), strIdx);
                    FieldBindingMng toRemove = connection.getFieldBindings().get(index);
                    fieldBindingMngService.deleteById(toRemove.getId());
                    enhancementService.deleteById(toRemove.getEnhancementId());
                    res = toRemove;
                } else if (path.matches("/fieldBindings") && op.equals("replace")) {
                    JsonNode value = next.get("value");
                    if (value.isNull()) {
                        List<FieldBindingMng> fieldBindings = connection.getFieldBindings();
                        fieldBindingMngService.deleteAll(fieldBindings);
                        enhancementService.deleteAll(fieldBindings.stream().map(FieldBindingMng::getEnhancementId).toList());
                    }
                } else if (op.equals("add") || op.equals("replace")) {
                    String strIdx = path.split("/")[2];
                    int index = findIndexOf(patched.getFieldBindings(), strIdx);
                    FieldBindingMng toAdd = patched.getFieldBindings().get(index);
                    Enhancement enhancement = enhancementMapper.toEntity(enhancementMngMapper.toDTO(toAdd.getEnhancement()));
                    Connection forEnhancement = new Connection();
                    forEnhancement.setId(connection.getConnectionId());
                    enhancement.setConnection(forEnhancement);
                    enhancementService.save(enhancement);
                    toAdd.setEnhancementId(enhancement.getId());
                    res = fieldBindingMngService.save(toAdd);
                }
            }
        }
        return res == null ? lastModified : res;
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
