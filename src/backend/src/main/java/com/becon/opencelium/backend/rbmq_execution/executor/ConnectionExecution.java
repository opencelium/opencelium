package com.becon.opencelium.backend.rbmq_execution.executor;

import com.becon.opencelium.backend.constant.Constant;
import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.rbmq_execution.mediator.ExecutionContext;
import com.becon.opencelium.backend.rbmq_execution.factory.ExecutionFactory;
import com.becon.opencelium.backend.neo4j.entity.ConnectorNode;

public class ConnectionExecution implements Execution{

    public void start(ExecutionContext executionContext) {
        Execution execution = ExecutionFactory.newExecution(ExecutionType.CONNECTOR);

        // First executing left connector and collecting data that will be sent to another connector
        ConnectorNode ctorNode = executionContext.getInitialData().getConnectionNode().getFromConnector();
        executionContext.setCurrentCtor(ctorNode);
        executionContext.setCtorDirection(Constant.CONN_FROM);
        execution.start(executionContext);

        // Executing connector that consumes data from first connector and executes its own methods and operators
        ctorNode = executionContext.getInitialData().getConnectionNode().getToConnector();
        executionContext.setCurrentCtor(ctorNode);
        executionContext.setCtorDirection(Constant.CONN_TO);
        execution.start(executionContext);
    }
}
