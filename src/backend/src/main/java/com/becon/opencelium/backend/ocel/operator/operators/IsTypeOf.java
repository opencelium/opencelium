package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operand.OperandUtils;
import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;

public class IsTypeOf implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o2 instanceof String str))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        Class<?> clazz = OperandUtils.getClassByType(str);
        if (clazz == null)
            throw ApplyOperatorException.invalidOperandValueException(getOperatorType(), o1, o2);
        return o1 == null || clazz.isInstance(o1);
    }

    @Override
    public Arity getArity() {
        return Arity.BINARY;
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return switch (sidesType) {
            case LEFT -> true;
            case RIGHT -> operand instanceof String s && OperandUtils.getClassByType(s) != null;
        };
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return switch (side) {
            case LEFT -> true;
            case RIGHT -> type.equals(String.class);
        };
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.IS_TYPE_OF;
    }
}
