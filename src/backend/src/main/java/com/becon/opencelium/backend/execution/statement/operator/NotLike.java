package com.becon.opencelium.backend.execution.statement.operator;

import java.util.Locale;
import java.util.regex.Pattern;

public class NotLike implements Operator{

    @Override
    public <T, S> boolean compare(T val1, S val2) {
        if (!(val1 instanceof String) || !(val2 instanceof String)) {
            throw new RuntimeException("Values should be string when using LIKE operator");
        }
        String text = (String) val1;
        String regex = "^" + ((String) val2).replace("%",".*") + "$";
        return !Pattern.matches(regex.toUpperCase(Locale.ROOT), text.toUpperCase(Locale.ROOT));
    }
}
