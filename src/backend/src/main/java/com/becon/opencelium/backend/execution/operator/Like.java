package com.becon.opencelium.backend.execution.operator;

import java.util.regex.Pattern;

public class Like implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        if (!(o1 instanceof String value) || !(o2 instanceof String)) {
            throw new RuntimeException("Like operator only supports String values");
        }

        // replace("_", ".") removed.
        String regex = "(?i)^" + ((String) o2).replace("%", ".*") + "$";
        return Pattern.compile(regex, Pattern.DOTALL).matcher(value).find();
    }
}
