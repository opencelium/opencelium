package com.becon.opencelium.backend.enums;

public enum RelationalOperator {
    EQUAL_TO("="),
    NOT_EQUAL_TO("!="),
    GREATER_THAN(">"),
    LESS_THAN_OR_EQUAL_TO("<="),
    LESS_THAN("<"),
    GREATER_THAN_OR_EQUAL_TO(">="),
    IS_NULL("IsNull"),
    IS_NOT_NULL("NotNull"),
    IS_EMPTY("IsEmpty"),
    IS_NOT_EMPTY("NotEmpty"),
    CONTAINS("Contains"),
    NOT_CONTAINS("NotContains"),
    PROPERTY_EXISTS("PropertyExists"),
    PROPERTY_NOT_EXISTS("PropertyNotExists"),
    CONTAINS_SUB_STR("ContainsSubStr"),
    NOT_CONTAINS_SUB_STR("NotContainsSubStr"),
    LIKE("Like"),
    NOT_LIKE("NotLike"),
    MATCHES("Matches"),
    IS_TYPE_OF("IsTypeOf"),
    MATCHES_IN_LIST("AllowList"),
    REGEX("RegEx"),
    DENYLIST("DenyList"),
    FOR("for"),
    FOR_IN("forin"),
    SPLIT_STRING("SplitString"),
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
