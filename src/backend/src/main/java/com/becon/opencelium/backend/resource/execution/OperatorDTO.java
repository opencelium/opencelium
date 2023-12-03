package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.execution.oc721.LogicalOperator;

public class OperatorDTO implements Executable {
    private OperatorType type;
    private String execOrder;
    private String iterator;
    private LogicalOperator logicalOperator;
    private String leftValueReference;
    private String rightValueReference;

    public OperatorType getType() {
        return type;
    }

    public void setType(OperatorType type) {
        this.type = type;
    }

    @Override
    public String getExecOrder() {
        return execOrder;
    }

    public void setExecOrder(String execOrder) {
        this.execOrder = execOrder;
    }

    public String getIterator() {
        return iterator;
    }

    public void setIterator(String iterator) {
        this.iterator = iterator;
    }

    public LogicalOperator getLogicalOperator() {
        return logicalOperator;
    }

    public void setLogicalOperator(LogicalOperator logicalOperator) {
        this.logicalOperator = logicalOperator;
    }

    public String getLeftValueReference() {
        return leftValueReference;
    }

    public void setLeftValueReference(String leftValueReference) {
        this.leftValueReference = leftValueReference;
    }

    public String getRightValueReference() {
        return rightValueReference;
    }

    public void setRightValueReference(String rightValueReference) {
        this.rightValueReference = rightValueReference;
    }
}
