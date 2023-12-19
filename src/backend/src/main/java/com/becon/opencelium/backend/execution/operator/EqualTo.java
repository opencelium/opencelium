package com.becon.opencelium.backend.execution.operator;

public class EqualTo implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        String value1 = o1.toString();
        String value2 = o2.toString();

        return value1.equals(value2);
    }
}
