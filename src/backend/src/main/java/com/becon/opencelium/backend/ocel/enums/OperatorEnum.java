package com.becon.opencelium.backend.ocel.enums;

import java.util.Arrays;

public enum OperatorEnum {
    // Logical operators
    OR(1, "||"),
    AND(2, "&&"),
    NOT(4, "!"),

    // Comparison operators
    EQUAL_TO(3, "="),
    NOT_EQUAL_TO(3, "!="),
    GREATER_THAN(3, ">"),
    LESS_THAN(3, "<"),
    GREATER_THAN_OR_EQUAL_TO(3, ">="),
    LESS_THAN_OR_EQUAL_TO(3, "<="),

    // Function-Like operators
    IS_NULL(5, "IsNull"),
    NOT_NULL(5, "NotNull"),
    IS_EMPTY(5, "IsEmpty"),
    NOT_EMPTY(5, "NotEmpty"),
    CONTAINS(5, "Contains"),
    NOT_CONTAINS(5, "NotContains"),
    PROPERTY_EXISTS(5, "PropertyExists"),
    PROPERTY_NOT_EXISTS(5, "PropertyNotExists"),
    CONTAINS_SUB_STR(5, "ContainsSubStr"),
    NOT_CONTAINS_SUB_STR(5, "NotContainsSubStr"),
    LIKE(5, "Like"),
    NOT_LIKE(5, "NotLike"),
    MATCHES(5, "Matches"),
    IS_TYPE_OF(5, "IsTypeOf"),
    MATCHES_IN_LIST(5, "AllowList"),
    REGEX(5, "RegExp"),
    DENY_LIST(5, "DenyList"),
    FOR(5, "for"),
    FOR_IN(5, "forin"),
    SPLIT_STRING(5, "SplitString");

    private final int precedence;
    private final String name;

    OperatorEnum(int precedence, String name) {
        this.precedence = precedence;
        this.name = name;
    }

    private static final OperatorEnum[] VALUES = OperatorEnum.values();

    public static OperatorEnum fromName(String name) {
        return Arrays.stream(VALUES)
                .filter(x -> x.name.equals(name))
                .findFirst()
                .orElse(null);
    }

    public int getPrecedence() {
        return precedence;
    }

    public String getName() {
        return name;
    }
}
