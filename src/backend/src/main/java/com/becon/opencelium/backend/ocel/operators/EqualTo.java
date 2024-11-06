package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

public class EqualTo implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (o1 == null || o2 == null) return o1 == o2;
        if (o1.getClass() != o2.getClass())
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

        String value1 = o1.toString();
        String value2 = o2.toString();

        return value1.equals(value2);
    }

    @Override
    public Object apply(Object o) {
        return Dummy.get();
    }

    @Override
    public Arity getArity() {
        return Arity.BINARY;
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return true;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.EQUAL_TO;
    }
}
