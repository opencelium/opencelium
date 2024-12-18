package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.common.ValueUtils;

public class EqualTo implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (ValueUtils.isNumber(o1) && ValueUtils.isNumber(o2)) {
            return 0 == ValueUtils.compareTo(o1, o2);
        }
        String value1 = o1 == null ? "null" : o1.toString();
        String value2 = o2 == null ? "null" : o2.toString();
        return value1.equals(value2);
    }

    @Override
    public Arity getArity() {
        return Arity.BINARY;
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return true;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return true;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.EQUAL_TO;
    }
}
