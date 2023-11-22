package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import com.becon.opencelium.backend.utility.patch.PatchHelper;
import com.github.fge.jsonpatch.JsonPatch;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService {
    private final ConnectionMngRepository connectionMngRepository;
    private final FieldBindingMngService fieldBindingMngService;
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;
    private final PatchHelper patchHelper;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("methodMngServiceImp")MethodMngService methodMngService,
            @Qualifier("operatorMngServiceImp")OperatorMngService operatorMngService, PatchHelper patchHelper) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
        this.patchHelper = patchHelper;
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        if(connectionMng==null) return null;
        if(connectionMng.getFromConnector()!=null){
            if(connectionMng.getFromConnector().getMethods()!=null){
                connectionMng.getFromConnector().setMethods(methodMngService.saveAll(connectionMng.getFromConnector().getMethods()));
            }
            if(connectionMng.getFromConnector().getOperators()!=null){
                connectionMng.getFromConnector().setOperators(operatorMngService.saveAll(connectionMng.getFromConnector().getOperators()));
            }
        }
        if(connectionMng.getToConnector()!=null){
            if(connectionMng.getToConnector().getMethods()!=null){
                connectionMng.getToConnector().setMethods(methodMngService.saveAll(connectionMng.getToConnector().getMethods()));
            }
            if(connectionMng.getToConnector().getOperators()!=null){
                connectionMng.getToConnector().setOperators(operatorMngService.saveAll(connectionMng.getToConnector().getOperators()));
            }
        }if(connectionMng.getFieldBindings()!=null){
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
    public String addMethod(Long connectionId, Integer connectorId, String methodId, JsonPatch patch) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);
        int index;
        MethodMng method;
        if (Objects.equals(connectorId, connectionMng.getFromConnector().getConnectorId())) {
            index = findIndexOfMethod(connectionMng.getFromConnector(), methodId);
            method = (index != -1) ? connectionMng.getFromConnector().getMethods().get(index) : new MethodMng();
            MethodMng patchedMethod = patchHelper.patch(patch, method, MethodMng.class);
            MethodMng savedMethod = methodMngService.save(patchedMethod);
            if(index!=-1){
                connectionMng.getFromConnector().getMethods().set(index, savedMethod);
            }else {
                connectionMng.getFromConnector().getMethods().add(savedMethod);
            }
            save(connectionMng);
            return savedMethod.getId();
        } else {
            index = findIndexOfMethod(connectionMng.getToConnector(), methodId);
            method = (index != -1) ? connectionMng.getToConnector().getMethods().get(index) : new MethodMng();
            MethodMng patchedMethod = patchHelper.patch(patch, method, MethodMng.class);
            MethodMng savedMethod = methodMngService.save(patchedMethod);
            if(index!=-1){
                connectionMng.getToConnector().getMethods().set(index, savedMethod);
            }else {
                connectionMng.getToConnector().getMethods().add(savedMethod);
            }
            save(connectionMng);
            return savedMethod.getId();
        }
    }

    @Override
    public String addOperator(Long connectionId, Integer connectorId, String operatorId, JsonPatch patch) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);

        int index;
        OperatorMng operator;
        if (Objects.equals(connectorId, connectionMng.getFromConnector().getConnectorId())) {
            index = findIndexOfOperator(connectionMng.getFromConnector(), operatorId);
            operator = (index != -1) ? connectionMng.getFromConnector().getOperators().get(index) : new OperatorMng();
            OperatorMng patchedOperator = patchHelper.patch(patch, operator, OperatorMng.class);
            OperatorMng savedOperator = operatorMngService.save(patchedOperator);
            if(index!=-1){
                connectionMng.getFromConnector().getOperators().set(index, savedOperator);
            }else {
                connectionMng.getFromConnector().getOperators().add(savedOperator);
            }
            save(connectionMng);
            return savedOperator.getId();
        } else {
            index = findIndexOfOperator(connectionMng.getToConnector(), operatorId);
            operator = (index != -1) ? connectionMng.getToConnector().getOperators().get(index) : new OperatorMng();
            OperatorMng patchedOperator = patchHelper.patch(patch, operator, OperatorMng.class);
            OperatorMng savedOperator = operatorMngService.save(patchedOperator);
            if(index!=-1){
                connectionMng.getToConnector().getOperators().set(index, savedOperator);
            }else {
                connectionMng.getToConnector().getOperators().add(savedOperator);
            }
            save(connectionMng);
            return savedOperator.getId();
        }
    }

    @Override
    public FieldBindingMng addEnhancement(Long connectionId, JsonPatch patch, FieldBindingMng fieldBindingMng) {
        ConnectionMng connectionMng = getByConnectionId(connectionId);
        int index = findIndexOfEnhancement(connectionMng, fieldBindingMng.getFieldBindingId());
        FieldBindingMng patched = patchHelper.patch(patch, fieldBindingMng, FieldBindingMng.class);
        FieldBindingMng saved = fieldBindingMngService.save(patched);
        if(index==-1){
            connectionMng.getFieldBindings().add(saved);
        }else {
            connectionMng.getFieldBindings().set(index, saved);
        }
        save(connectionMng);
        return saved;
    }

    private Integer findIndexOfOperator(ConnectorMng connector, String operatorId) {
        int index = -1;
        if (connector.getOperators() == null) {
            connector.setOperators(new ArrayList<>());
        } else {
            for (int i = 0; i < connector.getOperators().size(); i++) {
                if (connector.getOperators().get(i).getId().equals(operatorId)) {
                    index = i;
                    break;
                }
            }
        }
        return index;
    }
    private Integer findIndexOfMethod(ConnectorMng connector, String methodId) {
        int index = -1;
        if (connector.getMethods() == null) {
            connector.setMethods(new ArrayList<>());
        } else {
            for (int i = 0; i < connector.getMethods().size(); i++) {
                if (connector.getMethods().get(i).getId().equals(methodId)) {
                    index = i;
                    break;
                }
            }
        }
        return index;
    }
    private int findIndexOfEnhancement(ConnectionMng connectionMng, String id) {
        int index = -1;
        if(connectionMng.getFieldBindings()==null){
            connectionMng.setFieldBindings(new ArrayList<>());
        }
        for (int i = 0; i < connectionMng.getFieldBindings().size(); i++) {
            FieldBindingMng fieldBindingMng = connectionMng.getFieldBindings().get(i);
            if (fieldBindingMng.getFieldBindingId().equals(id)) {
                index = i;
                break;
            }
        }
        return index;
    }
}
