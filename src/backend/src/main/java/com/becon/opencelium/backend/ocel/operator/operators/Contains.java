package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.List;
import java.util.Objects;

class Contains implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        List<?> values;
        Object value = o2;

        if (o2 instanceof List<?> list) {
            values = (List<?>) list.get(1);
            value = list.get(0);
        } else {
            values = (List<?>) o1;
        }

        return values.contains(value) || ((value instanceof Number) && values.contains(value.toString()));
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.CONTAINS;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (side == SidesType.LEFT)
            return Objects.isNull(operand) || operand instanceof List<?>;

        return Objects.nonNull(operand)
                && (Utils.isPrimitiveType(operand) || (
                        operand instanceof List<?> list
                                && list.size() >= 2
                                && list.get(0) instanceof String
                                && list.get(1) instanceof List<?>
                )
        );
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        if(side == SidesType.LEFT)
            return Objects.isNull(type) || type.equals(List.class);
        return Utils.isPrimitiveType(type) || type.equals(List.class);
    }
}
