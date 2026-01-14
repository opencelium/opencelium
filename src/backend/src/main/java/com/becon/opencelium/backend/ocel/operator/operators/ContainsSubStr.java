package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;

import java.util.List;
import java.util.Objects;

public class ContainsSubStr implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        List<?> values;
        Object value;

        if (isArrayLeft(o1, o2)) {
            value = o2;
            values = (List<?>) o1;
        } else if (isArrayRight(o1, o2)) {
            value = o1;
            values = (List<?>) o2;
        } else if (isUnaryRight(o2)) {
            List<?> list = (List<?>) o2;
            values = (List<?>) list.get(1);
            value = list.get(0);
        } else {
            throw ApplyOperatorException.invalidOperandValueException(getOperatorType(), o1, o2);
        }

        for (Object o : values) {
            if (!(o instanceof String str)) {
                throw ApplyOperatorException.invalidOperandValueException(getOperatorType(), o);
            }

            if (str.contains(value.toString())) {
                return true;
            }
        }

        return false;
    }

    private boolean isUnaryRight(Object o2) {
        return o2 instanceof List<?> list && list.get(0) instanceof String && list.get(1) instanceof List<?>;
    }

    private boolean isArrayRight(Object o1, Object o2) {
        return o2 instanceof String && o1 instanceof List<?> list && isStringArray(list);
    }

    private boolean isStringArray(List<?> list) {
        for (Object o : list) {
            if (!(o instanceof String)) {
                return false;
            }
        }
        return true;
    }

    private boolean isArrayLeft(Object o1, Object o2) {
        return o1 instanceof List<?> && o2 instanceof String;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.CONTAINS_SUB_STR;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (side == SidesType.LEFT)
            return Objects.isNull(operand) || operand instanceof List<?> || operand instanceof String;

        return Objects.nonNull(operand) && (operand instanceof String || operand instanceof List<?>);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return side == SidesType.LEFT
                ? Objects.isNull(type) || type.equals(List.class) || type.equals(String.class)
                : type.equals(String.class) || type.equals(List.class);
    }
}
