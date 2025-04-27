package com.becon.opencelium.backend.execution.log_managing.commons;

public enum LogTrackerType {
    METHOD,
    LOOP,
    IF;

    public static LogTrackerType fromLogEntry(LogEntryType entryType) {
        return switch (entryType) {
            case METHOD_START,
                 METHOD_END,
                 REQUEST,
                 REQUEST_HEADER,
                 REQUEST_PAYLOAD,
                 RESPONSE,
                 RESPONSE_HEADER,
                 RESPONSE_PAYLOAD -> LogTrackerType.METHOD;
            case IF_START,
                 IF_RESULT,
                 IF_END -> LogTrackerType.IF;
            case LOOP_START,
                 LOOP_END -> LogTrackerType.LOOP;
            default -> throw new RuntimeException("No tracker found for : " + entryType);
        };
    }
}
