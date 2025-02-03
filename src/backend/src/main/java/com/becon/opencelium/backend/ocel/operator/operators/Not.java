package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.UnaryOperator;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;

public class Not implements UnaryOperator {

    @Override
    public Object apply(Object o) throws ApplyOperatorException {
        if (!ValueUtils.isBool(o))
            throw ApplyOperatorException.invalidTypeException(getOperatorType(), o);
        return !ValueUtils.parseBoolean(o);
    }

    @Override
    public boolean isLeftSided() {
        return true;
    }

    @Override
    public boolean isValidType(Class<?> type) {
        return type.equals(Boolean.class) || type.equals(String.class);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT;
    }
}
