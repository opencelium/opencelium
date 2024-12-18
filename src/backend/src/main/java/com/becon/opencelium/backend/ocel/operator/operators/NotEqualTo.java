package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;

public class NotEqualTo implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        try {
            return !(Boolean) new EqualTo().apply(o1, o2);
        } catch (ApplyOperatorException e) {
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        }
    }

    @Override
    public Arity getArity() {
        return Arity.BINARY;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT_EQUAL_TO;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        return true;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return true;
    }
}
