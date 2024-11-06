package com.becon.opencelium.backend.ocel.operators;

import com.becon.opencelium.backend.ocel.commons.Dummy;
import com.becon.opencelium.backend.ocel.enums.Arity;
import com.becon.opencelium.backend.ocel.enums.OperatorEnum;
import com.becon.opencelium.backend.ocel.enums.SidesType;

public class IsNull implements Operator {
    @Override
    public Object apply(Object o1, Object o2) {
        return Dummy.get();
    }

    @Override
    public Object apply(Object o) {
        return o == null;
    }

    @Override
    public Arity getArity() {
        return Arity.UNARY;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.IS_NULL;
    }
}
