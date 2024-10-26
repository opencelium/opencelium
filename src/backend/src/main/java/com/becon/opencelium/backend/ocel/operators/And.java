package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.InvalidTypeException;
import com.becon.opencelium.backend.ocel.enums.Arity;

public class And implements Operator {

    @Override
    public Boolean apply(Object o1, Object o2) throws InvalidTypeException {
        if (!(o1 instanceof Boolean o11) || !(o2 instanceof Boolean o22))
            throw new InvalidTypeException();
        return o11 && o22;
    }

    @Override
    public Object apply(Object o)  {
        return Dummy.get();
    }

    @Override
    public Arity getArity() {
        return Arity.BINAR;
    }

    @Override
    public int getPrecedence() {
        return OperatorEnum.AND.getPrecedence();
    }

    @Override
    public boolean isLeftSided() {
        return false;
    }

    @Override
    public boolean applicable(String left, String right) {
        return left != null
                && right != null
                && (left.equals("true") || left.equals("false"))
                && (right.equals("true") || right.equals("false"));
    }

    @Override
    public boolean applicable(String val) {
        return false;
    }
}
