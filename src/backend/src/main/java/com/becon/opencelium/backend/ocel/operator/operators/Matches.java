package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;

class Matches implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        // Accept any primitive scalar on both sides and coerce via toString().
        if (!Utils.isPrimitiveType(o1) || !Utils.isPrimitiveType(o2))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

        String value = o1.toString();
        String regex = o2.toString();

        try {
            return Pattern.matches(regex, value);
        } catch (PatternSyntaxException e) {
            throw ApplyOperatorException.invalidOperandValueException(getOperatorType(), o1, o2);
        }
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return Utils.isPrimitiveType(operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return Utils.isPrimitiveType(type);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.MATCHES;
    }
}
