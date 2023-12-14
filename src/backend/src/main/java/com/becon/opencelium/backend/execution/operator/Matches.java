package com.becon.opencelium.backend.execution.operator;

import java.util.regex.Pattern;

public class Matches implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        if (!(o1 instanceof String value) || !(o2 instanceof String regex)) {
            throw new RuntimeException("Matches operator only supports String values");
        }

        return Pattern.matches(regex, value);
    }
}
