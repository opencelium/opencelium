package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

import java.util.regex.Pattern;

public class Like implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o1 instanceof String s1) || !(o2 instanceof String s2)) {
            throw ApplyOperatorException.invalidTypePairsException(OperatorEnum.LIKE, o1, o2);
        }

        String regex = "(?i)^" + s2.replace("%", ".*") + "$";
        return Pattern.compile(regex, Pattern.DOTALL).matcher(s1).find();
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
        return OperatorEnum.LIKE.getPrecedence();
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
