package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.InvalidTypeException;

public class LessThanOrEqualTo implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws InvalidTypeException {
        return new GreaterThanOrEqualTo().apply(o2, o1);
    }

    @Override
    public Object apply(Object o) throws InvalidTypeException {
        return Dummy.get();
    }

    @Override
    public Arity getArity() {
        return Arity.BINAR;
    }

    @Override
    public int getPrecedence() {
        return OperatorEnum.LESS_THAN_OR_EQUAL_TO.getPrecedence();
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
