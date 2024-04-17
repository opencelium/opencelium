package com.becon.opencelium.backend.execution.operator;

import java.util.Map;

public class PropertyExists implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        if (!(o1 instanceof Map object)) {
            return false;
        }

        return object.containsKey(o2);
    }
}
