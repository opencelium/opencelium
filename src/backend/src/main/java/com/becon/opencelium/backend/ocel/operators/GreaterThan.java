package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.utils.DateUtils;
import com.becon.opencelium.backend.ocel.utils.NumberUtils;

public class GreaterThan implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (o1 instanceof Number n1 && o2 instanceof Number n2) {
            return NumberUtils.compareTo(n1, n2) > 0;
        }
        if (o1 instanceof String s1 && o2 instanceof String s2) {
            if (DateUtils.isDate(s1) && DateUtils.isDate(s2)) {
                return DateUtils.compareTo(s1, s2) > 0;
            }
        }
        throw ApplyOperatorException.invalidTypePairsException(OperatorEnum.GREATER_THAN, o1, o2);
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
        return OperatorEnum.GREATER_THAN.getPrecedence();
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
