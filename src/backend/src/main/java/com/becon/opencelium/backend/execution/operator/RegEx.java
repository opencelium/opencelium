package com.becon.opencelium.backend.execution.operator;

import java.util.regex.Pattern;

public class RegEx implements Operator {

    @Override
    public <T, S> boolean apply(T val1, S val2) {
        if (!(val1 instanceof String input) || !(val2 instanceof String regex)) {
            throw new RuntimeException("RegEx operator only supports String values");
        }

        return Pattern.matches(regex, input);
    }
}
