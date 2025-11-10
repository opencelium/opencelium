package com.becon.opencelium.backend.database.mongodb.dao;

import com.becon.opencelium.backend.database.mongodb.entity.FieldBindingMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;

public interface ConnectionMngDAO {
    MethodMng pushNewMethod(Long connectionId, String flowId, MethodMng entity);

    boolean existsConnection(Long connectionId);

    boolean existsFlowchart(Long connectionId, String flowId);

    void checkConnection(Long connectionId);

    void checkFlowchart(Long connectionId, String flowId);

    OperatorMng pushNewOperator(Long connectionId, String flowId, OperatorMng operatorMng);

    FieldBindingMng pushNewFieldBinding(Long connectionId, FieldBindingMng fb);
}
