package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;

import java.util.List;
import java.util.Map;
import java.util.Set;

class PropertyNotExists implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        return !(Boolean) (new PropertyExists().apply(o1, o2));
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.PROPERTY_NOT_EXISTS;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (side == SidesType.LEFT)
            return operand instanceof List<?> || operand instanceof Map<?, ?> || operand instanceof Set<?>;
        return true;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        if (side == SidesType.LEFT)
            return type.equals(List.class) || type.equals(Map.class) || type.equals(Set.class);
        return true;
    }
}
