package com.becon.opencelium.backend.execution.operator;

public class GreaterThan implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        double value1 = OperatorUtil.convertToDouble(o1, "GreaterThan");
        double value2 = OperatorUtil.convertToDouble(o2, "GreaterThan");

        return value1 > value2;
    }
}
