package com.becon.opencelium.backend.execution.operator;

public interface Operator {
    <T, S> boolean apply(T o1, S o2);
}
