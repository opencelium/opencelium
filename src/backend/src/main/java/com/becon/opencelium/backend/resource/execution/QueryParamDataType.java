package com.becon.opencelium.backend.resource.execution;

import org.apache.commons.lang3.StringUtils;

public enum QueryParamDataType {
    INT("int"),
    BOOLEAN("boolean"),
    DOUBLE("double"),
    STRING("string"),
    ARRAY("array");

    private final String type;

    QueryParamDataType(String type) {
        this.type = type;
    }

    public static QueryParamDataType fromString(String type) {
        for (QueryParamDataType dt : QueryParamDataType.values()) {
            if (StringUtils.equalsIgnoreCase(type, dt.type)) {
                return dt;
            }
        }

        throw new IllegalArgumentException("No enum constant for type = '" + type + "' in query param data types");
    }
}
