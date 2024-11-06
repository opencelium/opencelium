package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;

import java.util.regex.Pattern;

public class RegEx implements Operator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o1 instanceof String input) || !(o2 instanceof String regex))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

        return Pattern.matches(regex, input);
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
        return OperatorEnum.REGEX;
    }
}
