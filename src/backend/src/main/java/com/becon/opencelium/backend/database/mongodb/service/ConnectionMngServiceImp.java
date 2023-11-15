package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.repository.ConnectionMngRepository;
import com.becon.opencelium.backend.exception.ConnectionNotFoundException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ConnectionMngServiceImp implements ConnectionMngService {
    private final ConnectionMngRepository connectionMngRepository;
    private final FieldBindingMngService fieldBindingMngService;
    private final MethodMngService methodMngService;
    private final OperatorMngService operatorMngService;

    public ConnectionMngServiceImp(
            ConnectionMngRepository connectionMngRepository,
            @Qualifier("fieldBindingMngServiceImp") FieldBindingMngService fieldBindingMngService,
            @Qualifier("methodMngServiceImp")MethodMngService methodMngService,
            @Qualifier("operatorMngServiceImp")OperatorMngService operatorMngService
    ) {
        this.connectionMngRepository = connectionMngRepository;
        this.fieldBindingMngService = fieldBindingMngService;
        this.methodMngService = methodMngService;
        this.operatorMngService = operatorMngService;
    }

    @Override
    public ConnectionMng save(ConnectionMng connectionMng) {
        connectionMng.getFromConnector().setMethods(methodMngService.saveAll(connectionMng.getFromConnector().getMethods()));
        connectionMng.getToConnector().setMethods(methodMngService.saveAll(connectionMng.getToConnector().getMethods()));
        connectionMng.getFromConnector().setOperators(operatorMngService.saveAll(connectionMng.getFromConnector().getOperators()));
        connectionMng.getToConnector().setOperators(operatorMngService.saveAll(connectionMng.getToConnector().getOperators()));
        connectionMng.setFieldBindings(fieldBindingMngService.saveAll(connectionMng.getFieldBindings()));
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
    public OperatorMng addOperator(Long connectionId, Integer connectorId, OperatorMng operator) {
        ConnectionMng connection = getByConnectionId(connectionId);
        if (connection.getFromConnector() != null && connection.getFromConnector().getConnectorId().equals(connectorId)) {
            if(connection.getFromConnector().getOperators()==null){
                connection.getFromConnector().setOperators(new ArrayList<>());
            }
            connection.getFromConnector().getOperators().add(operator);
            ConnectionMng save = connectionMngRepository.save(connection);
//            return connection.getFromConnector().getOperators().stream().filter(o->)
        }

//        connector.setOperators(new ArrayList<>() {{
//            add(operator);
//        }});
        connectionMngRepository.save(connection);
        return new OperatorMng();
    }
}
