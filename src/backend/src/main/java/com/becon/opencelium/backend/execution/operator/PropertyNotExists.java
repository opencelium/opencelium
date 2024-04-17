package com.becon.opencelium.backend.execution.operator;

public class PropertyNotExists implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        return !(new PropertyExists().apply(o1, o2));
    }
}
