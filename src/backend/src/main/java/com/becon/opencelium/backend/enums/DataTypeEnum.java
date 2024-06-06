package com.becon.opencelium.backend.enums;

import java.util.List;
import java.util.Map;

public enum DataTypeEnum {
    NUM, ARR, OBJ, STR, BOOL;

    public static DataTypeEnum getEnumType(String type) {
        return switch (type) {
            case "NUM" -> NUM;
            case "ARR" -> ARR;
            case "OBJ" -> OBJ;
            case "STR" -> STR;
            case "BOOL" -> BOOL;
            default -> throw new RuntimeException("Data type " + type + " not found");
        };
    }

    public static Class getClass(DataTypeEnum type) {
        switch (type) {
            case ARR:
                return List.class;
            case NUM:
                return Number.class;
            case OBJ:
                return Map.class;
            case STR:
                return String.class;
            case BOOL:
                return Boolean.class;
            default:
                return null;
        }
    }
}
