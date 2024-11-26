package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;
import com.becon.opencelium.backend.ocel.exceptions.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;

public class Or implements Operator {

    @Override
    public Boolean apply(Object o1, Object o2) throws ApplyOperatorException {
        if (!ValueUtils.isBool(o1) || !ValueUtils.isBool(o2))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        return ValueUtils.parseBoolean(o1) || ValueUtils.parseBoolean(o2);
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
        return operand instanceof Boolean;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.OR;
    }
}
