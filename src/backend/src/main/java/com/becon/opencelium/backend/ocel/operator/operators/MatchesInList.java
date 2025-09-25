package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;

import java.util.List;

public class MatchesInList implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        if (o2 instanceof String) {
            String[] values = o2.toString().replace("\n", ",").split(",");
            Like like = new Like();

            for (String value : values) {
                Object result = like.apply(o1.toString(), value);
                if (Boolean.TRUE.equals(result)) {
                    return true;
                }
            }

            return false;
        }

        if (o1 instanceof String && o2 instanceof List<?> list) {
            Like like = new Like();
            for (Object value : list) {
                Object result = like.apply(o1.toString(), value);
                if (Boolean.TRUE.equals(result)) {
                    return true;
                }
            }

            return false;
        }
        throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.MATCHES_IN_LIST;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (side == SidesType.LEFT)
            return true;
        return operand instanceof String || operand instanceof List<?>;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        if (side == SidesType.LEFT)
            return true;
        return type.equals(String.class) || type.equals(List.class);
    }
}
