package com.becon.opencelium.backend.resource.execution;

public enum ActionType {
    IF("if"),
    LOOP("loop");

    private final String type;

    ActionType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}
