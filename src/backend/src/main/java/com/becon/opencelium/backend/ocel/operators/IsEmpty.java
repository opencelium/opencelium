package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.InvalidTypeException;

import java.util.List;

public class IsEmpty implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws InvalidTypeException {
        return Dummy.get();
    }

    @Override
    public Object apply(Object o) throws InvalidTypeException {
        if (!(o instanceof List)) {
            throw new InvalidTypeException();
        }
        return ((List<?>) o).isEmpty();
    }

    @Override
    public Arity getArity() {
        return Arity.UNAR;
    }

    @Override
    public int getPrecedence() {
        return OperatorEnum.IS_EMPTY.getPrecedence();
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
