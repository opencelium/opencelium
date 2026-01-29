package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.UnaryOperator;

class NotNull implements UnaryOperator {

    @Override
    public Object apply(Object o) {
        return o != null && !o.equals("null");
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.NOT_NULL;
    }

    @Override
    public boolean isValidType(Class<?> type) {
        return true;
    }
}
