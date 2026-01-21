package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.List;
import java.util.Objects;

public class Contains implements BinaryOperator {
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

        values = values.stream()
                .map(Object::toString)
                .toList();

        return values.contains(value.toString());
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.CONTAINS;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (side == SidesType.LEFT)
            return Objects.isNull(operand) || operand instanceof List<?> || Utils.isPrimitiveType(operand);

        return Objects.nonNull(operand) && (Utils.isPrimitiveType(operand) || operand instanceof List<?>);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return side == SidesType.LEFT
                ? Objects.isNull(type) || type.equals(List.class) || Utils.isPrimitiveType(type)
                : Utils.isPrimitiveType(type) || type.equals(List.class);
    }

    private boolean isUnaryRight(Object o2) {
        return o2 instanceof List<?> list && Utils.isPrimitiveType(list.get(0)) && list.get(1) instanceof List<?>;
    }

    private boolean isArrayRight(Object o1, Object o2) {
        return o2 instanceof List<?> list && Utils.isPrimitiveType(o1) && isPrimitiveArray(list);
    }

    private boolean isPrimitiveArray(List<?> list) {
        for (Object o : list) {
            if (!Utils.isPrimitiveType(o)) {
                return false;
            }
        }
        return true;
    }

    private boolean isArrayLeft(Object o1, Object o2) {
        return o1 instanceof List<?> && Utils.isPrimitiveType(o2);
    }
}
