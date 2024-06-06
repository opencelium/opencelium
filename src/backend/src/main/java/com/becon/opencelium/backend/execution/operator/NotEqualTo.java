package com.becon.opencelium.backend.execution.operator;

public class NotEqualTo implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        return !(new EqualTo().apply(o1, o2));
    }
}
