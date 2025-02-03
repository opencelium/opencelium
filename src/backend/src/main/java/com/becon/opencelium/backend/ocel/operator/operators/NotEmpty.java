package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.UnaryOperator;

import java.util.List;

public class NotEmpty implements UnaryOperator {
    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        try {
            return !(Boolean) new IsEmpty().apply(o);
        } catch (ApplyOperatorException e) {
            throw ApplyOperatorException.invalidTypeException(getOperatorType(), o);
        }
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT_EMPTY;
    }

    @Override
    public boolean isValidType(Class<?> type) {
        return type.equals(List.class);
    }
}
