package com.becon.opencelium.backend.execution.statement.operator;

import java.util.regex.Pattern;

public class RegEx implements Operator{
    @Override
    public <T, S> boolean compare(T val1, S val2) {
        if (!(val1 instanceof String) || !(val2 instanceof String)) {
            throw new RuntimeException("Values should be string when using RegEx operator");
        }

        String input = val1.toString();
        String regex = val2.toString().trim();
        return Pattern.matches(regex, input);
    }
}
