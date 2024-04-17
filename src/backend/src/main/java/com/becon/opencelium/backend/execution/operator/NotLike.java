package com.becon.opencelium.backend.execution.operator;

public class NotLike implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        return !(new Like().apply(o1, o2));
    }
}
