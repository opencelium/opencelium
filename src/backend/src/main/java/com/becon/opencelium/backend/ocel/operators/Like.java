package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

import java.util.regex.Pattern;

public class Like implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o1 instanceof String s1) || !(o2 instanceof String s2))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

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
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return operand instanceof String;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.LIKE;
    }
}
