package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.List;
import java.util.Objects;

public class ContainsSubStr implements BinaryOperator {
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

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.CONTAINS_SUB_STR;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (side == SidesType.LEFT)
            return Objects.isNull(operand) || operand instanceof List<?>;

        return Objects.nonNull(operand)
                && operand instanceof String || (
                operand instanceof List<?> list
                        && list.size() >= 2
                        && list.get(0) instanceof String
                        && list.get(1) instanceof List<?>
        );
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return side == SidesType.LEFT
                ? Objects.isNull(type) || type.equals(List.class)
                : type.equals(String.class) || type.equals(List.class);
    }
}
