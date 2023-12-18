package com.becon.opencelium.backend.enums;

public enum RelationalOperator {
    CONTAINS("Contains"),
    NOTCONTAINS("NotContains"),
    EQUALTO("EqualTo"),
    GREATERTHAN("GreaterThan"),
    GREATERTHANOREQUALTO("GreaterThanOrEqualTo"),
    LESSTHAN("LessThan"),
    LESSTHANOREQUALTO("LessThanOrEqualTo"),
    LIKE("Like"),
    MATCHES("Matches"),
    MATCHESINLIST("MatchesInList"),
    NOTLIKE("NotLike"),
    REGEX("RegEx"),
    PROPERTYNOTEXISTS("PropertyNotExists"),
    PROPERTYEXISTS("PropertyExists"),
    ISTYPEOF("IsTypeOf"),
    ISEMPTY("IsEmpty"),
    ISNOTEMPTY("IsNotEmpty"),
    ISNOTNULL("IsNotNull"),
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
