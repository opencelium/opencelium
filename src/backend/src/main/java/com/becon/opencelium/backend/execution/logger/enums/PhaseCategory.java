package com.becon.opencelium.backend.execution.logger.enums;

public enum PhaseCategory {
    EXECUTION,
    FLOWCHART,
    OPERATION,
    LOOP,
    IF,
    UNKNOWN;

    public static PhaseCategory fromValue(LogLineStage value) {
        return switch (value) {
            case EXECUTION_START, EXECUTION_END -> EXECUTION;
            case FLOWCHART_START, FLOWCHART_END -> FLOWCHART;
            case OPERATION_START, OPERATION_END -> OPERATION;
            case LOOP_START, LOOP_END -> LOOP;
            case IF_START, IF_END -> IF;
            default -> UNKNOWN;
        };
    }
}
