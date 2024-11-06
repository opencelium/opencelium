package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.enums.Arity;

public class And implements Operator {

    @Override
    public Boolean apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o1 instanceof Boolean o11) || !(o2 instanceof Boolean o22))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        return o11 && o22;
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
        return operand instanceof Boolean;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.AND;
    }
}
