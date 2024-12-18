package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;

public class LessThan implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        try {
            return new GreaterThan().apply(o2, o1); // o2 > o1
        } catch (ApplyOperatorException e) {
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        }
    }

    @Override
    public Arity getArity() {
        return Arity.BINARY;
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return new GreaterThan().isValidOperand(sidesType, operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return type.equals(Number.class) || type.equals(String.class);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.LESS_THAN;
    }
}
