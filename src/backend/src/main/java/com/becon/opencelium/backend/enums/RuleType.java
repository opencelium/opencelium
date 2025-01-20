package com.becon.opencelium.backend.enums;

public enum RuleType {
    REGEX("regex"),
    JSON_PATH("JSONPath"),
    X_PATH("XPath");

    private final String type;

    RuleType(String type) {
        this.type = type;
    }

    public static RuleType fromValue(String value)  {
        if (value == null || value.isEmpty()) {
            return null;
        }

        return switch (value) {
            case "regex" -> RuleType.REGEX;
            case "JSONPath" -> RuleType.JSON_PATH;
            case "XPath" -> RuleType.X_PATH;
            default -> throw new RuntimeException("Unknown Rule type was supplied, it should be 'regex' or 'JSONPath' or 'XPath'");
        };
    }

    public String getType() {
        return type;
    }
}
