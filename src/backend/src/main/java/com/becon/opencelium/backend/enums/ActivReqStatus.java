package com.becon.opencelium.backend.enums;

public enum ActivReqStatus {
    PENDING("PENDING"),
    PROCESSED("PROCESSED"),
    EXPIRED("EXPIRED");

    private final String value;

    ActivReqStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }
}