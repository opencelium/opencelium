package com.becon.opencelium.backend.enums.execution;


import org.apache.commons.lang3.StringUtils;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

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

    public static List<String> getTypes() {
        return Arrays.stream(DataType.values()).map(dt -> dt.type).collect(Collectors.toList());
    }

    public static DataType fromString(String type) {
        for (DataType dt : DataType.values()) {
            if (StringUtils.equalsIgnoreCase(type, dt.type)) {
                return dt;
            }
        }

        throw new IllegalArgumentException("No enum constant for type = '" + type + "' in query param data types");
    }
}
