package com.becon.opencelium.backend.execution2.executor;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.data.ExecutionData;

public class ConnectorExecution implements Execution {

    @Override
    public void start(ExecutionData executionData) {
        if (executionData == null) {
            throw new RuntimeException("Execution state is null in ConnectorExecutor");
        }
        Execution execution;
        // finding which action start first. If it is not method then operator
        if (executionData.getCurrentCtor().getStartMethod() != null) {
            execution = executionData.getExecutionInstance().get(ExecutionType.METHOD);
            executionData.setAction(executionData.getCurrentCtor().getStartMethod());
        } else {
            execution = executionData.getExecutionInstance().get(ExecutionType.STATEMENT);
            executionData.setAction(executionData.getCurrentCtor().getStartOperator());
        }

        executionData.getCurrentCtor().getWebService();

        execution.start(executionData);
    }
}
