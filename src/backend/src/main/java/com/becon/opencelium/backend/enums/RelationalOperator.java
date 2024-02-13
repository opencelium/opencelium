package com.becon.opencelium.backend.enums;

public enum RelationalOperator {
    CONTAINS("Contains"),
    NOT_CONTAINS("NotContains"),
    EQUAL_TO("EqualTo"),
    GREATER_THAN("GreaterThan"),
    GREATER_THAN_OR_EQUAL_TO("GreaterThanOrEqualTo"),
    LESS_THAN("LessThan"),
    LESS_THAN_OR_EQUAL_TO("LessThanOrEqualTo"),
    LIKE("Like"),
    MATCHES("Matches"),
    MATCHES_IN_LIST("MatchesInList"),
    NOT_LIKE("NotLike"),
    REGEX("RegEx"),
    PROPERTY_NOT_EXISTS("PropertyNotExists"),
    PROPERTY_EXISTS("PropertyExists"),
    IS_TYPE_OF("IsTypeOf"),
    IS_EMPTY("IsEmpty"),
    IS_NOT_EMPTY("IsNotEmpty"),
    IS_NOT_NULL("IsNotNull"),
    ISNULL("IsNull"),
    DEFAULT(null);

    private final String name;

    RelationalOperator(String name) {
        this.name = name;
    }
    public static RelationalOperator fromName(String name) {
        if (name != null) {
            for (RelationalOperator g : RelationalOperator.values()) {
                if (name.equalsIgnoreCase(g.name)) {
                    return g;
                }
            }
        }
        return DEFAULT;
    }
}
