package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

public class NotEmpty implements Operator {
    @Override
    public Object apply(Object o1, Object o2) {
        return Dummy.get();
    }

    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        try {
            return !(Boolean) new IsEmpty().apply(o);
        } catch (ApplyOperatorException e) {
            throw ApplyOperatorException.invalidTypeException(OperatorEnum.NOT_EMPTY, o);
        }
    }

    @Override
    public Arity getArity() {
        return Arity.UNAR;
    }

    @Override
    public int getPrecedence() {
        return OperatorEnum.NOT_EMPTY.getPrecedence();
    }

    @Override
    public boolean isLeftSided() {
        return false;
    }

    @Override
    public boolean applicable(String left, String right) {
        return false;
    }

    @Override
    public boolean applicable(String val) {
        return false;
    }
}
