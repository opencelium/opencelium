package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.*;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;

import java.util.function.Supplier;

public class Or implements BinaryOperator, BoolOperator {

    @Override
    public Boolean apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!ValueUtils.isBool(o1) || !ValueUtils.isBool(o2))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        return ValueUtils.parseBoolean(o1) || ValueUtils.parseBoolean(o2);
    }

    @Override
    public Boolean apply(Supplier<Boolean> x, Supplier<Boolean> y) {
        return x.get() ? Boolean.TRUE : y.get();
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return operand instanceof Boolean;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return type.equals(Boolean.class) || type.equals(String.class);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.OR;
    }
}
