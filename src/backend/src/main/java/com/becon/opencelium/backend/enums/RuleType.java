package com.becon.opencelium.backend.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RuleType {
    REGEX("regex"),
    JSON_PATH("JSONPath"),
    X_PATH("XPath");

    private final String type;

    RuleType(String type) {
        this.type = type;
    }

    @JsonValue
    public String getValue() {
        return type;
    }

    @JsonCreator
    public static RuleType fromValue(String value) {
        for (RuleType ruleType : RuleType.values()) {
            if (ruleType.type.equalsIgnoreCase(value)) {
                return ruleType;
            }
        }

        throw new IllegalArgumentException("Unknown Rule type was supplied, it should be 'regex' or 'JSONPath' or 'XPath'");
    }
}
