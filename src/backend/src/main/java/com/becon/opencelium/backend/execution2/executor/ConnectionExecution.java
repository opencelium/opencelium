package com.becon.opencelium.backend.execution2.executor;

import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.data.ExecutionData;
import com.becon.opencelium.backend.execution2.factory.ExecutionFactory;
import com.becon.opencelium.backend.neo4j.entity.ConnectorNode;

public class ConnectionExecution implements Execution{

    public void start(ExecutionData executionData) {
        Execution execution = ExecutionFactory.newExecution(ExecutionType.CONNECTOR);

        // First executing left connector and collecting data that will be sent to another connector
        ConnectorNode ctorNode = executionData.getInitialData().getConnectionNode().getFromConnector();
        executionData.setCurrentCtor(ctorNode);
        executionData.setCtorDirection(Constant.CONN_FROM);
        execution.start(executionData);

        // Executing connector that consumes data from first connector and executes its own methods and operators
        ctorNode = executionData.getInitialData().getConnectionNode().getToConnector();
        executionData.setCurrentCtor(ctorNode);
        executionData.setCtorDirection(Constant.CONN_TO);
        execution.start(executionData);
    }
}
