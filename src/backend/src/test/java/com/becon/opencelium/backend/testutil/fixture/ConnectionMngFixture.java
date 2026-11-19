package com.becon.opencelium.backend.testutil.fixture;

import com.becon.opencelium.backend.database.mongodb.entity.ConnectionMng;
import com.becon.opencelium.backend.database.mongodb.entity.ConnectorMng;
import com.becon.opencelium.backend.database.mongodb.entity.MethodMng;
import com.becon.opencelium.backend.database.mongodb.entity.OperatorMng;
import com.becon.opencelium.backend.database.mongodb.entity.RequestMng;

import java.util.ArrayList;
import java.util.List;

/**
 * Named test objects for the content of a workflow as MongoDB stores it.
 */
public final class ConnectionMngFixture {

    private ConnectionMngFixture() {}

    /**
     * Method with a request that has only an endpoint.
     * Use as the element under test and add a label, headers or a body where a test needs them.
     */
    public static MethodMng aMethod(String color, String index, String name, String endpoint) {
        RequestMng request = new RequestMng();
        request.setEndpoint(endpoint);

        MethodMng method = new MethodMng();
        method.setColor(color);
        method.setIndex(index);
        method.setName(name);
        method.setRequest(request);
        return method;
    }

    /** Operator of the given type with an expression and no condition. */
    public static OperatorMng anOperator(String index, String type, String expression) {
        OperatorMng operator = new OperatorMng();
        operator.setIndex(index);
        operator.setType(type);
        operator.setExpression(expression);
        return operator;
    }

    /** Workflow whose single connector holds the given methods and no operator. */
    public static ConnectionMng aWorkflowWith(MethodMng... methods) {
        ConnectionMng workflow = new ConnectionMng();
        workflow.setFromConnector(aConnectorWith(methods));
        return workflow;
    }

    /** Connector with the given methods and an empty, mutable list of operators. */
    public static ConnectorMng aConnectorWith(MethodMng... methods) {
        ConnectorMng connector = new ConnectorMng();
        connector.setMethods(new ArrayList<>(List.of(methods)));
        connector.setOperators(new ArrayList<>());
        return connector;
    }
}
