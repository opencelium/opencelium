package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;

import java.util.regex.Pattern;

public class Like implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!(o1 instanceof String s1) || !(o2 instanceof String s2))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

        String regex = "(?i)^" + s2.replace("%", ".*") + "$";
        return Pattern.compile(regex, Pattern.DOTALL).matcher(s1).find();
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
        return OperatorEnum.LIKE;
    }
}
