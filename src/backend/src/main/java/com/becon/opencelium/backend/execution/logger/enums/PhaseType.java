package com.becon.opencelium.backend.execution.logger.enums;

public enum PhaseType implements LogLineStage {
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
    IF_END;

    public static PhaseType fromString(String phase) {
        for (PhaseType v : values()) {
            if (v.name().equalsIgnoreCase(phase)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown Phase type: " + phase);
    }

    public static boolean containsFromString(String stage) {
        for (PhaseType v : values()) {
            if (v.name().equalsIgnoreCase(stage)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public LogLineType getStageType() {
        return LogLineType.PHASE;
    }
}
