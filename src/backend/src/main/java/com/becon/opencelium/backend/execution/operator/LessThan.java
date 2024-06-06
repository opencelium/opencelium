package com.becon.opencelium.backend.execution.operator;

public class LessThan implements Operator {

    @Override
    public <T, S> boolean apply(T o1, S o2) {
        double value1 = OperatorUtil.convertToDouble(o1, "LessThan");
        double value2 = OperatorUtil.convertToDouble(o2, "LessThan");

        return value1 < value2;
    }
}
