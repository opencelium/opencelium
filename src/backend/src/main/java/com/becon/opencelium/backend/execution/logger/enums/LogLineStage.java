package com.becon.opencelium.backend.execution.logger.enums;

public enum LogLineStage {
    // PHASE values
    EXECUTION_START,
    EXECUTION_END,
    FLOWCHART_START,
    FLOWCHART_END,
    OPERATION_START,
    OPERATION_END,
    LOOP_START,
    LOOP_END,
    IF_START,
    IF_END,

    // SEGMENT values
    REQUEST,
    REQUEST_HEADER,
    REQUEST_PAYLOAD,
    RESPONSE,
    RESPONSE_HEADER,
    RESPONSE_PAYLOAD,
    EXCEPTION;

    public static LogLineStage fromString(String value) {
        for (LogLineStage v : values()) {
            if (v.name().equalsIgnoreCase(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown LogLineValue: " + value);
    }
}
