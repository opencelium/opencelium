package com.becon.opencelium.backend.enums;

import com.becon.opencelium.backend.database.mysql.entity.MaskingRule;
import com.becon.opencelium.backend.execution.masking.JsonPathMaskingRule;
import com.becon.opencelium.backend.execution.masking.RegexMaskingRule;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum RuleType {
    REGEX("regex") {
        @Override
        public String apply(String message, MaskingRule rule) {
            return new RegexMaskingRule().apply(message, rule);
        }
    },
    JSON_PATH("JSONPath") {
        @Override
        public String apply(String message, MaskingRule rule) {
            return new JsonPathMaskingRule().apply(message, rule);
        }
    },
    X_PATH("XPath") {
        @Override
        public String apply(String message, MaskingRule rule) {
            return null;
        }
    };

    private final String type;

    RuleType(String type) {
        this.type = type;
    }

    public abstract String apply(String message, MaskingRule rule);

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
