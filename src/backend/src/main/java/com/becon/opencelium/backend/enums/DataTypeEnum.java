package com.becon.opencelium.backend.enums;

import java.util.List;
import java.util.Map;

public enum DataTypeEnum {
    NUM, ARR, OBJ, STR, BOOL;

    public static DataTypeEnum getEnumType(String type) {
        switch (type) {
            case "NUM":
                return NUM;
            case "ARR":
                return ARR;
            case "OBJ":
                return OBJ;
            case "STR":
                return STR;
            case "BOOL":
                return BOOL;
            default:
                throw new RuntimeException("Dara type " + type + " not found");
        }
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
