package com.becon.opencelium.backend.database.mongodb.service;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.resource.connection.v5.MapperDTO;
import com.becon.opencelium.backend.resource.connection.MethodDTO;
import com.becon.opencelium.backend.resource.connection.OperatorDTO;
import com.becon.opencelium.backend.resource.partialconnection.FlowchartCreateRequest;
import com.github.fge.jsonpatch.JsonPatch;

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

    String addFlowchart(FlowchartCreateRequest request);

    MethodDTO addMethod(Long connectionId, String flowId, MethodDTO method);

    MethodDTO updateMethod(Long connectionId, String flowId, MethodDTO method);

    MethodDTO updateMethod(Long connectionId, String flowId, String methodId, JsonPatch patch);

    void deleteMethod(Long connectionId, String flowId, String methodId);

    OperatorDTO addOperator(Long connectionId, String flowId, OperatorDTO operator);

    OperatorDTO updateOperator(Long connectionId, String flowId, OperatorDTO operator);

    OperatorDTO updateOperator(Long connectionId, String flowId, String operatorId, JsonPatch patch);

    void deleteOperator(Long connectionId, String flowId, String operatorId);

    MapperDTO addMapper(Long connectionId, MapperDTO fieldBinding);

    MapperDTO updateMapper(Long connectionId, MapperDTO fieldBinding);

    MapperDTO updateMapper(Long connectionId, String fbId, JsonPatch patch);

    void deleteMapper(Long connectionId, String fbId);
}
