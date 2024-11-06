package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

public class Not implements Operator {

    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        return Dummy.get();
    }

    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        if (!(o instanceof Boolean oo))
            throw ApplyOperatorException.invalidTypeException(getOperatorType(), o);
        return !oo;
    }

    @Override
    public Arity getArity() {
        return Arity.UNARY;
    }

    @Override
    public boolean isLeftSided() {
        return true;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT;
    }
}
