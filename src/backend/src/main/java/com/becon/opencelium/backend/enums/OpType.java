package com.becon.opencelium.backend.enums;

public enum OpType {
    TEST("test"),
    PAGINATION("page"),
    AUTH("auth");
    private final String value;

    OpType(String value) {
        this.value = value;
    }
    public static OpType fromValue(String value) {
        for (OpType opType : OpType.values()) {
            if (opType.getValue().equals(value)) {
                return opType;
            }
        }
        throw new IllegalArgumentException(value);
    }

    public String getValue() {
        return value;
    }
}
