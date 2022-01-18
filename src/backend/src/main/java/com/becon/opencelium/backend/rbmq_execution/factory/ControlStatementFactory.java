package com.becon.opencelium.backend.rbmq_execution.factory;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.rbmq_execution.executor.Execution;
import com.becon.opencelium.backend.rbmq_execution.statement.ForStatementExecution;
import com.becon.opencelium.backend.rbmq_execution.statement.IfStatementExecution;

public class ControlStatementFactory {

    public static Execution newStatement(ExecutionType type) {
        switch (type) {
            case IFSTATEMENT:
                return new ForStatementExecution();
            case FORSTATEMENT:
                return new IfStatementExecution();
            default:
                throw new RuntimeException("Control statement " + type + " not found");
        }
    }
}
