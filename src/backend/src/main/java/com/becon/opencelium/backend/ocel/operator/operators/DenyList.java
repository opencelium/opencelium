package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;

import java.util.List;
import java.util.Objects;

public class DenyList implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (o1 instanceof String && o2 instanceof String) {
            String[] split = ((String) o2).split(",");
            for (String s : split) {
                if (Objects.equals(s, o1))
                    return false;
            }
            return true;
        }
        if (o1 instanceof String val && o2 instanceof List<?> list) {
            for (Object o : list) {
                if (Objects.equals(o, o1))
                    return false;
            }
            return true;
        }
        throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.DENY_LIST;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (operand == null) return false;
        if (side == SidesType.LEFT) {
            return operand instanceof String;
        }
        if (operand instanceof String) {
            return true;
        }
        if (operand instanceof List<?> list) {
            for (Object o : list) {
                if (!(o instanceof String)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        if (side == SidesType.LEFT)
            return type.equals(String.class);

        return type.equals(String.class) || type.equals(List.class);
    }
}
