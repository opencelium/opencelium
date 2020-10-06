package com.becon.opencelium.backend.execution2.executor;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.mediator.ExecutionContext;

public class ConnectorExecution implements Execution {

    @Override
    public void start(ExecutionContext executionContext) {
        if (executionContext == null) {
            throw new RuntimeException("Execution state is null in ConnectorExecutor");
        }
        Execution execution;
        // finding which action start first. If it is not method then operator
        if (executionContext.getCurrentCtor().getStartMethod() != null) {
            execution = executionContext.getExecutionInstance().get(ExecutionType.METHOD);
            executionContext.setAction(executionContext.getCurrentCtor().getStartMethod());
        } else {
            execution = executionContext.getExecutionInstance().get(ExecutionType.STATEMENT);
            executionContext.setAction(executionContext.getCurrentCtor().getStartOperator());
        }

        execution.start(executionContext);
    }
}
