package com.becon.opencelium.backend.execution.log_managing.enums;

public enum LogEntryType {
    EXECUTION_START(1, 2),
    EXECUTION_END(2, -1),
    METHOD_START(3, 4),
    METHOD_END(4, -1),
    REQUEST(5, -1),
    REQUEST_HEADER(6, -1),
    REQUEST_PAYLOAD(7, -1),
    RESPONSE(8, -1),
    RESPONSE_HEADER( 9,-1),
    RESPONSE_PAYLOAD(10, -1),
    LOOP_START(11, 12),
    LOOP_END(12, -1),
    IF_START(13, 14),
    IF_END(14, -1),
    IF_RESULT(15, -1);

    private final int code;
    private final int tailCode;

    LogEntryType(int code, int tailCode) {
        this.code = code;
        this.tailCode = tailCode;
    }

    public int getCode() {
        return code;
    }

    public int getTailCode() {
        return tailCode;
    }
}
