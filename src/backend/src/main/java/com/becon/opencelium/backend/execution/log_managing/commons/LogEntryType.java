package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.Arrays;

public enum LogEntryType {
    EXECUTION_START("EXECUTION_START", 1, 2),
    EXECUTION_END("EXECUTION_END", 2, -1),
    METHOD_START("METHOD_START", 3, 4),
    METHOD_END("METHOD_END", 4, -1),
    REQUEST("REQUEST", 5, -1),
    REQUEST_HEADER("REQUEST_HEADER", 6, -1),
    REQUEST_PAYLOAD("REQUEST_PAYLOAD", 7, -1),
    RESPONSE("RESPONSE", 8, -1),
    RESPONSE_HEADER("RESPONSE_HEADER", 9, -1),
    RESPONSE_PAYLOAD("RESPONSE_PAYLOAD", 10, -1),
    LOOP_START("LOOP_START", 11, 12),
    LOOP_END("LOOP_END", 12, -1),
    IF_START("IF_START", 13, 14),
    IF_END("IF_END", 14, -1),
    IF_RESULT("IF_RESULT", 15, -1);

    private final String title;
    private final int code;
    private final int tailCode;

    LogEntryType(String title, int code, int tailCode) {
        this.title = title;
        this.code = code;
        this.tailCode = tailCode;
    }

    public static LogEntryType getByTitleOrElseNull(String title) {
        return Arrays.stream(values())
                .filter(x -> x.getTitle().equals(title))
                .findFirst()
                .orElse(null);
    }

    public String getTitle() {
        return title;
    }

    public int getCode() {
        return code;
    }

    public int getTailCode() {
        return tailCode;
    }
}
