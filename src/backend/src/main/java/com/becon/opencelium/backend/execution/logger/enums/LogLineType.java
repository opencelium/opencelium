package com.becon.opencelium.backend.execution.logger.enums;

public enum LogLineType {
    PHASE, SEGMENT;

    public static LogLineType fromString(String value) {
        for (LogLineType v : values()) {
            if (v.name().equalsIgnoreCase(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown LogLineType: " + value);
    }
}
