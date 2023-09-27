package com.becon.opencelium.backend.resource.execution;

public enum DataType {
    STRING("string"),
    NUMBER("number"),
    INTEGER("integer"),
    BOOLEAN("boolean"),
    ARRAY("array");

    private final String type;

    private DataType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}
