package com.becon.opencelium.backend.database.mongodb.dao;

import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.ReferenceMng;

public interface ConnectionMngDAO {
    MethodMng pushNewMethod(Long connectionId, String flowId, MethodMng entity);

    boolean existsConnection(Long connectionId);

    boolean existsFlowchart(Long connectionId, String flowId);

    void checkConnection(Long connectionId);

    void checkFlowchart(Long connectionId, String flowId);

    OperatorMng pushNewOperator(Long connectionId, String flowId, OperatorMng operatorMng);

    ReferenceMng pushNewReference(Long connectionId, ReferenceMng fb);

    void removeReference(Long connectionId, String fbId);

    void removeOperator(Long connectionId, String flowId, String operatorId);

    void removeMethod(Long connectionId, String flowId, String methodId);
}
