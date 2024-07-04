package com.becon.opencelium.backend.enums.execution;


public enum DataType {
    STRING("string"),
    NUMBER("number"),
    INTEGER("integer"),
    BOOLEAN("boolean"),
    ARRAY("array"),
    OBJECT("object"),
    UNDEFINED("undefined");

    private final String type;

    DataType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    public boolean isPrimitive() {
        return this.type.equals("string") || this.type.equals("number") || this.type.equals("integer") || this.type.equals("boolean");
    }
}
