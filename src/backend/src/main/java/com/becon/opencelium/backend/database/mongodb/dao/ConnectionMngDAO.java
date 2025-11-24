package com.becon.opencelium.backend.database.mongodb.dao;

import com.becon.opencelium.backend.database.mongodb.criteria.ConnectionCriteria;
import com.becon.opencelium.backend.database.mongodb.entity.*;
import com.becon.opencelium.backend.database.mysql.entity.Connector;
import com.becon.opencelium.backend.resource.partialconnection.FlowchartCreateRequest;

public interface ConnectionMngDAO {
    MethodMng pushNewMethod(Long connectionId, String flowId, MethodMng entity);

    ConnectionMng getConnection(Long connectionId, ConnectionCriteria criteria);

    boolean existsConnection(Long connectionId);

    boolean existsFlowchart(Long connectionId, String flowId);

    void checkConnection(Long connectionId);

    void checkFlowchart(Long connectionId, String flowId);

    OperatorMng pushNewOperator(Long connectionId, String flowId, OperatorMng operatorMng);

    void removeMapper(Long connectionId, String fbId);

    void removeOperator(Long connectionId, String flowId, String operatorId);

    void removeMethod(Long connectionId, String flowId, String methodId);

    FlowchartMng addFlowchart(FlowchartCreateRequest request);

    MapperMng pushNewMapperAndUpdatePlan(Long connectionId, MapperMng mapper, ExecutionPlanMng executionPlan);

    void updateExecutionPlan(Long connectionId, ExecutionPlanMng executionPlan);

    void update(ConnectionMng connectionMng);
}
