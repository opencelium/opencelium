package com.becon.opencelium.backend.execution.log_managing.commons;

import java.util.Arrays;

public enum LogEntryType {
    EXECUTION_START("EXECUTION_START", true, false),
    EXECUTION_END("EXECUTION_END", false, true),
    METHOD_START("METHOD_START", true, false),
    METHOD_END("METHOD_END", false, true),
    REQUEST("REQUEST", false, false),
    REQUEST_HEADER("REQUEST_HEADER", false, false),
    REQUEST_PAYLOAD("REQUEST_PAYLOAD", false, false),
    RESPONSE("RESPONSE", false, false),
    RESPONSE_HEADER("RESPONSE_HEADER", false, false),
    RESPONSE_PAYLOAD("RESPONSE_PAYLOAD", false, false),
    LOOP_START("LOOP_START", true, false),
    LOOP_END("LOOP_END", false, true),
    IF_START("IF_START", true, false),
    IF_END("IF_END", false, true),
    IF_RESULT("IF_RESULT", false, false);

    private final String title;
    private final boolean startingNewStack;
    private final boolean endingStack;

    LogEntryType(String title, boolean startingNewStack, boolean endingStack) {
        this.title = title;
        this.startingNewStack = startingNewStack;
        this.endingStack = endingStack;
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

    public boolean isStartingNewStack() {
        return startingNewStack;
    }

    public boolean isEndingStack() {
        return endingStack;
    }
}
