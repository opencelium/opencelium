package com.becon.opencelium.backend.execution.logmanaging.commons;

import java.util.Arrays;
import java.util.Objects;

public enum LogElementType {
    METHOD("method"),
    LOOP("loop"),
    IF("if");

    private final String secondName;

    LogElementType(String secondName) {
        this.secondName = secondName;
    }

    public String getSecondName() {
        return secondName;
    }

    public static LogElementType fromSecondNameOrElseNull(String secondName) {
        return Arrays.stream(values())
                .filter(v -> Objects.equals(v.secondName, secondName))
                .findFirst()
                .orElse(null);
    }
}