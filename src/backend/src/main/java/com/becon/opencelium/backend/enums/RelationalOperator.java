package com.becon.opencelium.backend.enums;

public enum RelationalOperator {
    EQUALTO("="),
    NOTEQUALTO("!="),
    GREATERTHAN(">"),
    LESSTHANOREQUALTO("<="),
    LESSTHAN("<"),
    GREATERTHANOREQUALTO(">="),
    ISNULL("IsNull"),
    ISNOTNULL("NotNull"),
    ISEMPTY("IsEmpty"),
    ISNOTEMPTY("NotEmpty"),
    CONTAINS("Contains"),
    NOTCONTAINS("NotContains"),
    PROPERTYEXISTS("PropertyExists"),
    PROPERTYNOTEXISTS("PropertyNotExists"),
    CONTAINSSUBSTR("ContainsSubStr"),
    NOTCONTAINSSUBSTR("NotContainsSubStr"),
    LIKE("Like"),
    NOTLIKE("NotLike"),
    MATCHES("Matches"),
    ISTYPEOF("IsTypeOf"),
    MATCHESINLIST("AllowList"),
    REGEX("RegEx"),
    DENYLIST("DenyList"),
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
