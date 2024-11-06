package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

import java.util.List;

public class IsEmpty implements Operator {
    @Override
    public Object apply(Object o1, Object o2) {
        return Dummy.get();
    }

    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        if (!(o instanceof List)) {
            throw ApplyOperatorException.invalidTypeException(getOperatorType(), o);
        }
        return ((List<?>) o).isEmpty();
    }

    @Override
    public Arity getArity() {
        return Arity.UNARY;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.IS_EMPTY;
    }
}
