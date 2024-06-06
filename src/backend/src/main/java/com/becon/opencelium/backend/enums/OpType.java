package com.becon.opencelium.backend.enums;

public enum OpType {
    TEST("test"),
    PAGINATION("page"),
    AUTH("auth"),
    DEFAULT("");
    private final String value;

    OpType(String value) {
        this.value = value;
    }
    public static OpType fromValue(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
         return switch (value) {
            case "test" -> OpType.TEST;
            case "page" -> OpType.PAGINATION;
            case "auth" -> OpType.AUTH;
            default -> OpType.DEFAULT;
        };
    }

    public String getValue() {
        return value;
    }
}
