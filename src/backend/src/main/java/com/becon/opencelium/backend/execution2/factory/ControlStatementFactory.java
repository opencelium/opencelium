package com.becon.opencelium.backend.execution2.factory;

import com.becon.opencelium.backend.enums.ExecutionType;
import com.becon.opencelium.backend.execution2.executor.Execution;
import com.becon.opencelium.backend.execution2.statement.ForStatementExecution;
import com.becon.opencelium.backend.execution2.statement.IfStatementExecution;

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
