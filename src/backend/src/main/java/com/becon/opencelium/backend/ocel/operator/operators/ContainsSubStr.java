package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.utils.Utils;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;

import java.util.List;
import java.util.Objects;

class ContainsSubStr implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        // Normalize: convert String operands that contain arrays into real Lists
        o1 = ValueUtils.normalizeArray(o1);
        o2 = ValueUtils.normalizeArray(o2);

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

        if (value == null) {
            return false;
        }

        String target = value.toString();
        for (Object o : values) {
            if (o != null && o.toString().contains(target)) {
                return true;
            }
        }

        return false;
    }

    private boolean isUnaryRight(Object o2) {
        return o2 instanceof List<?> list && list.size() == 2
                && Utils.isPrimitiveType(list.get(0)) && list.get(1) instanceof List<?>;
    }

    private boolean isArrayRight(Object o1, Object o2) {
        return o2 instanceof List<?> && Utils.isPrimitiveType(o1) && !isUnaryRight(o2);
    }

    private boolean isArrayLeft(Object o1, Object o2) {
        return o1 instanceof List<?> && (o2 == null || Utils.isPrimitiveType(o2));
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.CONTAINS_SUB_STR;
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
}
