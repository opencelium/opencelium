package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.resource.connection.ReferenceDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;

import java.util.List;

public interface ConnectionMngService {
    boolean existsByConnectionId(Long id);

    ConnectionMng save(ConnectionMng connectionMng);

    ConnectionMng saveDirectly(ConnectionMng connectionMng);

    ConnectionMng getByConnectionId(Long connectionId);

    List<ConnectionMng> getAll();

    ConnectionMng delete(Long id);

    void updateWithoutBinding(ConnectionMng connectionMng);

    List<ConnectionMng> getAllById(List<Long> ids);

    long count();

    void createNewConnection(Long connectionId);

    String addFlowchart(Long id, Connector connector);

    MethodDTO addMethod(Long connectionId, String flowId, MethodDTO method);

    MethodDTO updateMethod(Long connectionId, String flowId, MethodDTO method);

    OperatorDTO addOperator(Long connectionId, String flowId, OperatorDTO operator);

    OperatorDTO updateOperator(Long connectionId, String flowId, OperatorDTO operator);

    ReferenceDTO addFieldBinding(Long connectionId, ReferenceDTO fieldBinding);

    ReferenceDTO updateFieldBinding(Long connectionId, ReferenceDTO fieldBinding);
}
