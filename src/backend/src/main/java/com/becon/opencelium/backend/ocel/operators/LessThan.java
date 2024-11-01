package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

public class LessThan implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        try {
            return new GreaterThan().apply(o2, o1); // o2 > o1
        } catch (ApplyOperatorException e) {
            throw ApplyOperatorException.invalidTypePairsException(OperatorEnum.LESS_THAN, o1, o2);
        }
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
    public int getPrecedence() {
        return OperatorEnum.LESS_THAN.getPrecedence();
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
