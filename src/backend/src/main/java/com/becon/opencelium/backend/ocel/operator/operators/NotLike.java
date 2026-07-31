package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;

class NotLike implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        return !(Boolean) new Like().apply(o1, o2);
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return new Like().isValidOperand(sidesType, operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return new Like().isValidType(side, type);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT_LIKE;
    }
}
