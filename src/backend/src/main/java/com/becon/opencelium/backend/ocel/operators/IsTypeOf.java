package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.DataType;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

public class IsTypeOf implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o2 instanceof String str))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        Class<?> clazz = DataType.getEnumClass(str);
        if (clazz == null)
            throw ApplyOperatorException.invalidOperandValueException(getOperatorType(), o1, o2);
        return o1 == null || clazz.isInstance(o1);
    }

    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        return Dummy.get();
    }

    @Override
    public Arity getArity() {
        return Arity.BINARY;
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return switch (sidesType) {
            case LEFT -> true;
            case RIGHT -> operand instanceof String s && DataType.getEnumClass(s) != null;
        };
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.IS_TYPE_OF;
    }
}
