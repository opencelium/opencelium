package com.becon.opencelium.backend.execution.operator;

public class IsNotNull implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        return o1 != null;
    }
}