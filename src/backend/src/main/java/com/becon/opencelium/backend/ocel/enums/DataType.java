package com.becon.opencelium.backend.ocel.enums;

import java.util.List;

public enum DataType {
    NULL(Object.class),
    BOOLEAN(Boolean.class),
    NUMBER(Number.class),
    STRING(String.class),

    ARRAY_OF_BOOLEAN(List.class),
    ARRAY_OF_STRING(List.class),
    ARRAY_OF_NUMBER(List.class);

    private final Class<?> clazz;

    DataType(Class<?> clazz) {
        this.clazz = clazz;
    }

    public static Class<?> getEnumClass(String type) {
        return switch (type) {
            case "NUM" -> Number.class;
            case "ARR" -> List.class;
            case "OBJ" -> Object.class;
            case "STR" -> String.class;
            case "BOOL" -> Boolean.class;
            default -> null;
        };
    }

    public static boolean checkTypeName(String typeName) {
        return getEnumClass(typeName) != null;
    }

    public Class<?> getClazz() {
        return clazz;
    }
}
