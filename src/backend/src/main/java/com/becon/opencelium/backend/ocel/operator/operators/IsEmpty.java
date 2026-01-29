package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.UnaryOperator;

import java.util.List;

class IsEmpty implements UnaryOperator {

    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        if (!(o instanceof List)) {
            throw ApplyOperatorException.invalidTypeException(getOperatorType(), o);
        }
        return ((List<?>) o).isEmpty();
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.IS_EMPTY;
    }

    @Override
    public boolean isValidType(Class<?> type) {
        return type.equals(List.class);
    }
}
