package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.enums.RelationalOperator;

public class ConditionEx {
    private String left;
    private String right;
    private RelationalOperator relationalOperator;

    public ConditionEx() {
    }

    public String getLeft() {
        return left;
    }

    public void setLeft(String left) {
        this.left = left;
    }

    public String getRight() {
        return right;
    }

    public void setRight(String right) {
        this.right = right;
    }

    public RelationalOperator getRelationalOperator() {
        return relationalOperator;
    }

    public void setRelationalOperator(RelationalOperator relationalOperator) {
        this.relationalOperator = relationalOperator;
    }
}