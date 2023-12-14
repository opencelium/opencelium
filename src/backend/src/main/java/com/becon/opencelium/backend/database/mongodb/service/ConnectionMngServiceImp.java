package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.container.Command;
import com.becon.opencelium.backend.container.ConnectionUpdateTracker;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.database.mysql.service.ConnectionHistoryService;
import com.becon.opencelium.backend.enums.Action;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
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
    private final ConnectionUpdateTracker connectionUpdateTracker;
    private final ConnectionHistoryService connectionHistoryService;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("methodMngServiceImp") MethodMngService methodMngService,
            @Qualifier("operatorMngServiceImp") OperatorMngService operatorMngService,
            PatchHelper patchHelper,
            ObjectMapper objectMapper,
            ConnectionUpdateTracker connectionUpdateTracker,
            @Qualifier("connectionHistoryServiceImp") ConnectionHistoryService connectionHistoryService
    ) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
        this.patchHelper = patchHelper;
        this.objectMapper = objectMapper;
        this.connectionUpdateTracker = connectionUpdateTracker;
        this.connectionHistoryService = connectionHistoryService;
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
        if (connectionMng.getFieldBindings() != null) {
            connectionMng.setFieldBindings(fieldBindingMngService.saveAll(connectionMng.getFieldBindings()));
        }
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
    public String updateMethod(Long connectionId, Integer connectorId, String methodId, JsonPatch patch) {
        if (isAdd(patch)) {
            return addMethod(connectionId, connectorId, patch);
        } else if (isRemove(patch)) {
            return removeMethod(connectionId, connectorId, methodId);
        } else {
            ConnectionMng connectionMng = getByConnectionId(connectionId);
            int index;
            MethodMng method;
            if (Objects.equals(connectorId, connectionMng.getFromConnector().getConnectorId())) {
                index = findIndexOfMethod(connectionMng.getFromConnector(), methodId);
                method = connectionMng.getFromConnector().getMethods().get(index);
                MethodMng patchedMethod = patchHelper.patch(patch, method, MethodMng.class);
                MethodMng savedMethod = methodMngService.save(patchedMethod);
                connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("replace", "/fromConnector/methods/" + (connectionMng.getFromConnector().getMethods().size() - 1), method)));
                connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("replace", "/fromConnector/methods/" + (connectionMng.getFromConnector().getMethods().size() - 1), savedMethod), Action.MODIFY);
                return savedMethod.getId();
            } else {
                index = findIndexOfMethod(connectionMng.getToConnector(), methodId);
                method = connectionMng.getToConnector().getMethods().get(index);
                MethodMng patchedMethod = patchHelper.patch(patch, method, MethodMng.class);
                MethodMng savedMethod = methodMngService.save(patchedMethod);
                connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("replace", "/toConnector/methods/" + (connectionMng.getToConnector().getMethods().size() - 1), method)));
                connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("replace", "/toConnector/methods/" + (connectionMng.getToConnector().getMethods().size() - 1), savedMethod), Action.MODIFY);
                return savedMethod.getId();
            }
        }
    }

    private String addMethod(Long connectionId, Integer connectorId, JsonPatch patch) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);

        MethodMng patchedMethod = patchHelper.patch(patch, new MethodMng(), MethodMng.class);
        MethodMng savedMethod = methodMngService.save(patchedMethod);
        if (connectionMng.getFromConnector().getConnectorId().equals(connectorId)) {
            if (connectionMng.getFromConnector().getMethods() == null)
                connectionMng.getFromConnector().setMethods(new ArrayList<>());
            connectionMng.getFromConnector().getMethods().add(savedMethod);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("remove", "/fromConnector/methods/" + (connectionMng.getFromConnector().getMethods().size() - 1))));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("add", "/fromConnector/methods/" + (connectionMng.getFromConnector().getMethods().size() - 1), savedMethod), Action.MODIFY);
        } else {
            if (connectionMng.getToConnector().getMethods() == null)
                connectionMng.getToConnector().setMethods(new ArrayList<>());
            connectionMng.getToConnector().getMethods().add(savedMethod);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("remove", "/toConnector/methods/" + (connectionMng.getToConnector().getMethods().size() - 1))));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("add", "/toConnector/methods/" + (connectionMng.getToConnector().getMethods().size() - 1), savedMethod), Action.MODIFY);
        }
        return savedMethod.getId();
    }

    @Override
    public String updateOperator(Long connectionId, Integer connectorId, String operatorId, JsonPatch patch) {
        if (isAdd(patch)) {
            return addOperator(connectionId, connectorId, patch);
        } else if (isRemove(patch)) {
            return removeOperator(connectionId, connectorId, operatorId);
        } else {
            ConnectionMng connectionMng = getByConnectionId(connectionId);
            int index;
            OperatorMng operator;
            if (Objects.equals(connectorId, connectionMng.getFromConnector().getConnectorId())) {
                index = findIndexOfOperator(connectionMng.getFromConnector(), operatorId);
                operator = connectionMng.getFromConnector().getOperators().get(index);
                OperatorMng patchedOperator = patchHelper.patch(patch, operator, OperatorMng.class);
                OperatorMng savedOperator = operatorMngService.save(patchedOperator);
                connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("replace", "/fromConnector/operators/" + (connectionMng.getFromConnector().getOperators().size() - 1), operator)));
                connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("replace", "/fromConnector/operators/" + (connectionMng.getFromConnector().getOperators().size() - 1), savedOperator), Action.MODIFY);
                return savedOperator.getId();
            } else {
                index = findIndexOfOperator(connectionMng.getToConnector(), operatorId);
                operator = connectionMng.getToConnector().getOperators().get(index);
                OperatorMng patchedOperator = patchHelper.patch(patch, operator, OperatorMng.class);
                OperatorMng savedOperator = operatorMngService.save(patchedOperator);
                connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("replace", "/toConnector/operators/" + (connectionMng.getToConnector().getOperators().size() - 1), operator)));
                connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("replace", "/toConnector/operators/" + (connectionMng.getToConnector().getOperators().size() - 1), savedOperator), Action.MODIFY);
                return savedOperator.getId();
            }
        }
    }

    private String removeOperator(Long connectionId, Integer connectorId, String operatorId) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);

        if (connectionMng.getFromConnector().getConnectorId().equals(connectorId)) {
            int index = findIndexOfOperator(connectionMng.getFromConnector(), operatorId);
            OperatorMng removed = connectionMng.getFromConnector().getOperators().remove(index);
            operatorMngService.deleteById(operatorId);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("add", "/fromConnector/operators/" + index, removed)));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("remove", "/fromConnector/operators/" + index), Action.MODIFY);
            return removed.getId();
        } else {
            int index = findIndexOfOperator(connectionMng.getToConnector(), operatorId);
            OperatorMng removed = connectionMng.getToConnector().getOperators().remove(index);
            operatorMngService.deleteById(operatorId);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("add", "/toConnector/operators/" + index, removed)));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("remove", "/toConnector/operators/" + index), Action.MODIFY);
            return removed.getId();
        }
    }

    private String addOperator(Long connectionId, Integer connectorId, JsonPatch patch) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);

        OperatorMng patchedOperator = patchHelper.patch(patch, new OperatorMng(), OperatorMng.class);
        OperatorMng savedOperator = operatorMngService.save(patchedOperator);
        if (connectionMng.getFromConnector().getConnectorId().equals(connectorId)) {
            if (connectionMng.getFromConnector().getOperators() == null)
                connectionMng.getFromConnector().setOperators(new ArrayList<>());
            connectionMng.getFromConnector().getOperators().add(savedOperator);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("remove", "/fromConnector/operators/" + (connectionMng.getFromConnector().getOperators().size() - 1))));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("add", "/fromConnector/operators/" + (connectionMng.getFromConnector().getOperators().size() - 1), savedOperator), Action.MODIFY);
        } else {
            if (connectionMng.getToConnector().getOperators() == null)
                connectionMng.getToConnector().setOperators(new ArrayList<>());
            connectionMng.getToConnector().getOperators().add(savedOperator);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("remove", "/toConnector/operators/" + (connectionMng.getToConnector().getOperators().size() - 1))));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("add", "/toConnector/operators/" + (connectionMng.getToConnector().getOperators().size() - 1), savedOperator), Action.MODIFY);
        }
        return savedOperator.getId();
    }

    @Override
    public FieldBindingMng updateFieldBinding(Long connectionId, JsonPatch patch, FieldBindingMng fieldBindingMng) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);

        if (isAdd(patch)) {
            FieldBindingMng patched = patchHelper.patch(patch, new FieldBindingMng(), FieldBindingMng.class);
            FieldBindingMng saved = fieldBindingMngService.save(patched);
            if (connectionMng.getFieldBindings() == null)
                connectionMng.setFieldBindings(new ArrayList<>());
            connectionMng.getFieldBindings().add(saved);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("remove", "/fieldBindings/" + (connectionMng.getFieldBindings().size() - 1))));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("add", "/fieldBindings/" + (connectionMng.getFieldBindings().size() - 1), saved), Action.MODIFY);
            return saved;
        } else if (isRemove(patch)) {
            int index = findIndexOfEnhancement(connectionMng, fieldBindingMng.getFieldBindingId());
            FieldBindingMng removed = connectionMng.getFieldBindings().remove(index);
            fieldBindingMngService.deleteById(removed.getFieldBindingId());
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("add", "/fieldBindings/" + index, removed)));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("remove", "/fieldBindings/" + index), Action.MODIFY);
            return removed;
        } else {
            int index = findIndexOfEnhancement(connectionMng, fieldBindingMng.getFieldBindingId());
            FieldBindingMng toUpdate = connectionMng.getFieldBindings().get(index);
            FieldBindingMng patched = patchHelper.patch(patch, toUpdate, FieldBindingMng.class);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("replace", "/fieldBindings/" + index, toUpdate)));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("replace", "/fieldBindings/" + index, patched), Action.MODIFY);
            return fieldBindingMngService.save(patched);
        }
    }

    @Override
    public ConnectionMng patchUpdate(Long connectionId, JsonPatch patch) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);
        ConnectionMng updated = patchHelper.patch(patch, connectionMng, ConnectionMng.class);
        removeOrUpdateChildFields(connectionMng, patch);
        return save(updated);
    }

    public String removeMethod(Long connectionId, Integer connectorId, String methodId) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);

        if (connectionMng.getFromConnector().getConnectorId().equals(connectorId)) {
            int index = findIndexOfMethod(connectionMng.getFromConnector(), methodId);
            MethodMng removed = connectionMng.getFromConnector().getMethods().remove(index);
            methodMngService.deleteById(methodId);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("add", "/fromConnector/methods/" + index, removed)));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("remove", "/fromConnector/methods/" + index), Action.MODIFY);
            return removed.getId();
        } else {
            int index = findIndexOfMethod(connectionMng.getToConnector(), methodId);
            MethodMng removed = connectionMng.getToConnector().getMethods().remove(index);
            methodMngService.deleteById(methodId);
            save(connectionMng);
            connectionUpdateTracker.push(new Command(connectionId, patchHelper.getJsonPatch("add", "/toConnector/methods/" + index, removed)));
            connectionHistoryService.makeHistoryAndSave(connectionId, patchHelper.getJsonPatch("remove", "/toConnector/methods/" + index), Action.MODIFY);
            return removed.getId();
        }
    }

    private void removeOrUpdateChildFields(ConnectionMng connectionMng, JsonPatch patch) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String path = next.get("path").textValue();
            String op = next.get("op").textValue();
            if (path.matches("/fieldBindings/\\d+")) {
                int index = Integer.parseInt(path.split("/")[2]);
                if (op.equals("remove")) {
                    FieldBindingMng toDelete = connectionMng.getFieldBindings().get(index);
                    fieldBindingMngService.deleteById(toDelete.getFieldBindingId());
                }else if (op.equals("replace")){
                    FieldBindingMng toDelete = connectionMng.getFieldBindings().get(index);
                    fieldBindingMngService.save(toDelete);
                }
            } else if (path.matches("/fromConnector/operators/\\d+")) {
                int index = Integer.parseInt(path.split("/")[3]);
                if (op.equals("remove")) {
                    OperatorMng toDelete = connectionMng.getFromConnector().getOperators().get(index);
                    operatorMngService.deleteById(toDelete.getId());
                }else if (op.equals("replace")){
                    OperatorMng toDelete = connectionMng.getFromConnector().getOperators().get(index);
                    operatorMngService.save(toDelete);
                }
            } else if (path.matches("/toConnector/operators/\\d+")) {
                int index = Integer.parseInt(path.split("/")[3]);
                if (op.equals("remove")) {
                    OperatorMng toDelete = connectionMng.getToConnector().getOperators().get(index);
                    operatorMngService.deleteById(toDelete.getId());
                }else if (op.equals("replace")){
                    OperatorMng toDelete = connectionMng.getToConnector().getOperators().get(index);
                    operatorMngService.save(toDelete);
                }
            } else if (path.matches("/fromConnector/methods/\\d+")) {
                int index = Integer.parseInt(path.split("/")[3]);
                if (op.equals("remove")) {
                    MethodMng toDelete = connectionMng.getFromConnector().getMethods().get(index);
                    methodMngService.deleteById(toDelete.getId());
                }else if (op.equals("replace")){
                    MethodMng toDelete = connectionMng.getFromConnector().getMethods().get(index);
                    methodMngService.save(toDelete);
                }
            } else if (path.matches("/toConnector/methods/\\d+")) {
                int index = Integer.parseInt(path.split("/")[3]);
                if (op.equals("remove")) {
                    MethodMng toDelete = connectionMng.getToConnector().getMethods().get(index);
                    methodMngService.deleteById(toDelete.getId());
                }else if (op.equals("replace")){
                    MethodMng toDelete = connectionMng.getToConnector().getMethods().get(index);
                    methodMngService.save(toDelete);
                }
            }
        }
    }

    private int findIndexOfOperator(ConnectorMng connector, String operatorId) {
        for (int i = 0; i < connector.getOperators().size(); i++) {
            if (connector.getOperators().get(i).getId().equals(operatorId)) {
                return i;
            }
        }
        return -1;
    }

    private int findIndexOfMethod(ConnectorMng connector, String methodId) {
        for (int i = 0; i < connector.getMethods().size(); i++) {
            if (connector.getMethods().get(i).getId().equals(methodId)) {
                return i;
            }
        }
        return -1;
    }

    private int findIndexOfEnhancement(ConnectionMng connectionMng, String id) {
        for (int i = 0; i < connectionMng.getFieldBindings().size(); i++) {
            FieldBindingMng fieldBindingMng = connectionMng.getFieldBindings().get(i);
            if (fieldBindingMng.getFieldBindingId().equals(id)) {
                return i;
            }
        }
        return -1;
    }

    private boolean isAdd(JsonPatch patch) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String op = next.get("op").asText();
            String path = next.get("path").asText();
            if (op.equals("add") && path.equals("")) {
                return true;
            }
        }
        return false;
    }

    private boolean isRemove(JsonPatch patch) {
        JsonNode jsonNode = objectMapper.convertValue(patch, JsonNode.class);
        Iterator<JsonNode> nodes = jsonNode.elements();
        while (nodes.hasNext()) {
            JsonNode next = nodes.next();
            String op = next.get("op").asText();
            String path = next.get("path").asText();
            if (op.equals("remove") && path.equals("")) {
                return true;
            }
        }
        return false;
    }
}
