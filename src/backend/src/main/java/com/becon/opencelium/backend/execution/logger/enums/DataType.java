package com.becon.opencelium.backend.execution.logger.enums;

public enum DataType {
    EXCEPTION, // e.g. "java.lang.NullPointerException: ..."
    JSON,      // e.g. "2025-05-22 10:10:10 INFO segment=PAYLOAD data={\"key\":\"value\"}"
    XML,       // e.g. "2025-05-22 10:11:11 INFO segment=PAYLOAD data=<note>OK</note>"
    TEXT,      // e.g. "2025-05-22 10:12:12 INFO segment=PAYLOAD data=Hello world" followed by indented lines
    SINGLE     // any other single-line entry
}
