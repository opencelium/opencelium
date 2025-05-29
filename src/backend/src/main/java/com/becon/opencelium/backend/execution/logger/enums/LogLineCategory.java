package com.becon.opencelium.backend.execution.logger.enums;

public enum LogLineCategory {
    EXECUTION,
    FLOWCHART,
    OPERATION,
    LOOP,
    IF,
    REQUEST,
    RESPONSE,
    HEADER,
    PAYLOAD,
    UNKNOWN;

    public static LogLineCategory fromValue(LogLineValue value) {
        return switch (value) {
            case EXECUTION_START, EXECUTION_END -> EXECUTION;
            case FLOWCHART_START, FLOWCHART_END -> FLOWCHART;
            case OPERATION_START, OPERATION_END -> OPERATION;
            case LOOP_START, LOOP_END -> LOOP;
            case IF_START, IF_END -> IF;
            case REQUEST -> REQUEST;
            case RESPONSE -> RESPONSE;
            case REQUEST_HEADER, RESPONSE_HEADER -> HEADER;
            case REQUEST_PAYLOAD, RESPONSE_PAYLOAD -> PAYLOAD;
            default -> UNKNOWN;
        };
    }
}
