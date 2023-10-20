package com.becon.opencelium.backend.execution.notification.enums;

public enum NotifyTool {
    TEAMS("teams"), EMAIL("email"), SLACK("slack");

    private final String name;

    NotifyTool(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return name;
    }
}
