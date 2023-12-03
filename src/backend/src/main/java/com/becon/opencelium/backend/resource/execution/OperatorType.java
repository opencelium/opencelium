package com.becon.opencelium.backend.resource.execution;

public enum OperatorType {
    IF("if"),
    LOOP("loop");

    private final String type;

    OperatorType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}
