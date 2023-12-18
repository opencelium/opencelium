package com.becon.opencelium.backend.execution.operator;

import java.util.regex.Pattern;

public class Like implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        if (!(o1 instanceof String value) || !(o2 instanceof String)) {
            throw new RuntimeException("Like operator only supports String values");
        }

        String regex = "^" + ((String) o2).replace("_", ".").replace("%", ".*") + "$";
        return Pattern.matches(regex, value);
    }
}
