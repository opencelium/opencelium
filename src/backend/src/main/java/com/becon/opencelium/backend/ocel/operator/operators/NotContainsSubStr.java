package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;

class NotContainsSubStr implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        return !(Boolean) (new ContainsSubStr().apply(o1, o2));
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT_CONTAINS_SUB_STR;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        return new ContainsSubStr().isValidOperand(side, operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return new ContainsSubStr().isValidType(side, type);
    }
}
