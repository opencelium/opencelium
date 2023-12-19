package com.becon.opencelium.backend.execution.operator;

public class GreaterThanOrEqualTo implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        double value1 = OperatorUtil.convertToDouble(o1, "GreaterThanOrEqualTo");
        double value2 = OperatorUtil.convertToDouble(o2, "GreaterThanOrEqualTo");

        return value1 >= value2;
    }
}
