package com.becon.opencelium.backend.execution2.factory;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.executor.*;

public class ExecutionFactory {

    private ExecutionType executionType;

    public static Execution newExecution(ExecutionType executionType) {
        switch (executionType) {
            case CONNECTION:
                return new ConnectionExecution();
            case CONNECTOR:
                return new ConnectorExecution();
            case METHOD:
                return new MethodExecution();
            case STATEMENT:
                return new StatementExecution();
            default:
                throw new RuntimeException("Execution Type Not Found");
        }
    }
}
