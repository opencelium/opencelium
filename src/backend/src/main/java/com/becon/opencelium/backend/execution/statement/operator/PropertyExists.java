package com.becon.opencelium.backend.execution.statement.operator;

import java.util.Map;

public class PropertyExists implements Operator{

    // val1 map
    // val2 property
    @Override
    public <T, S> boolean compare(T val1, S val2) {
        if (!(val1 instanceof Map)) {
            throw new RuntimeException("Object required when trying to find property");
        }
        Map<String, Object> object = (Map) val1;

        return object.containsKey(val2);
    }
}
