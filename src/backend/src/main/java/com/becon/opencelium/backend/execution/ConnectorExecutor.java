package com.becon.opencelium.backend.execution;

import com.becon.opencelium.backend.resource.execution.Executable;
import com.becon.opencelium.backend.resource.execution.OperationDTO;

import java.util.Queue;

public class ConnectorExecutor {

    private final Queue<Executable> executables;
    private final ExecutionManager executionManager;

    public ConnectorExecutor(Queue<Executable> executables, ExecutionManager executionManager) {
        this.executables = executables;
        this.executionManager = executionManager;
    }

    private Executable getNextExecutable(boolean previousResult) {
        return executables.poll();
    }

    private boolean execute(Executable executable) {
        if (executable instanceof OperationDTO) {
            return executeOperation(executable);
        }

        return executeOperator(executable);
    }
}
