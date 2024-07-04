package com.becon.opencelium.backend.enums.execution;

public enum NotifyTool {
    EMAIL("email"), INCOMING_WEBHOOK("incoming_webhook");

    private final String name;

    NotifyTool(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return name;
    }
}
