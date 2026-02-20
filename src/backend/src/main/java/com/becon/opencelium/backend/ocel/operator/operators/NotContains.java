package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;

class NotContains implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        return !(Boolean) (new Contains().apply(o1, o2));
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT_CONTAINS;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        return new Contains().isValidOperand(side, operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return new Contains().isValidType(side, type);
    }
}
