package com.becon.opencelium.backend.execution.operator;

public class LessThanOrEqualTo implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        double value1 = OperatorUtil.convertToDouble(o1, "LessThanOrEqualTo");
        double value2 = OperatorUtil.convertToDouble(o2, "LessThanOrEqualTo");

        return value1 <= value2;
    }
}
