package com.becon.opencelium.backend.execution.operator;

public class NotContainsSubStr implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        return !(new ContainsSubStr().apply(o1, o2));
    }
}
