package com.becon.opencelium.backend.execution.action;

import com.becon.opencelium.backend.execution.ExecutionManager;

public class IfAction implements Action {
    private String leftValue;
    private String rightValue;
    private LogicalOperator logicalOperator;
    private ExecutionManager executionManager;
}
