package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;

class DenyList implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        return !(Boolean) new MatchesInList().apply(o1, o2);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.DENY_LIST;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        return new MatchesInList().isValidOperand(side, operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return new MatchesInList().isValidType(side, type);
    }
}
