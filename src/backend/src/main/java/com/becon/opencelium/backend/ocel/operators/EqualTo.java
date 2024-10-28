package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.InvalidTypeException;

import java.util.List;

public class EqualTo implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws InvalidTypeException {
        if (o1 == null) return o2 == null;
        if (o1.getClass() != o2.getClass())
            throw InvalidTypeException.mismatchTypeException(OperatorEnum.EQUAL_TO, List.of(o1.getClass()), o2.getClass());

        String value1 = o1.toString();
        String value2 = o2.toString();

        return value1.equals(value2);
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
        return OperatorEnum.EQUAL_TO.getPrecedence();
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
