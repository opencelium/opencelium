package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;

import java.util.regex.Pattern;

class RegEx implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o1 instanceof String input) || !(o2 instanceof String regex))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

        return Pattern.matches(regex, input);
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return operand instanceof String;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return type.equals(String.class);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.REGEX;
    }
}
