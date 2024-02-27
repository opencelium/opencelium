package com.becon.opencelium.backend.resource.execution;

import com.becon.opencelium.backend.enums.DataTypeEnum;

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

    public static DataType getEnumType(String type) {
        return switch (type.toUpperCase()) {
            case "NUM" -> NUMBER;
            case "INT" -> INTEGER;
            case "ARR" -> ARRAY;
            case "OBJ" -> OBJECT;
            case "STR" -> STRING;
            case "BOOL" -> BOOLEAN;
            default -> throw new RuntimeException("Dara type " + type + " not found");
        };
    }
}
