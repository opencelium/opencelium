package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.utils.DateUtils;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;

public class GreaterThanOrEqualTo implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (ValueUtils.isNumber(o1) && ValueUtils.isNumber(o2)) {
            return ValueUtils.compareTo(o1, o2) >= 0;
        }
        if (DateUtils.isDate(o1) && DateUtils.isDate(o2)) {
            return DateUtils.compareTo(o1, o2) >= 0;
        }
        if (DateUtils.isDateTime(o1) && DateUtils.isDateTime(o2)) {
            return DateUtils.compareTo(o1, o2) >= 0;
        }
        throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
    }

    @Override
    public Arity getArity() {
        return Arity.BINARY;
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return new GreaterThan().isValidOperand(sidesType, operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return type.equals(Number.class) || type.equals(String.class);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.GREATER_THAN_OR_EQUAL_TO;
    }
}
