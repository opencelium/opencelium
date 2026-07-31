package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

class MatchesInList implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        // A null left operand can never match any pattern.
        if (o1 == null) {
            return false;
        }

        List<String> patterns = toPatterns(o2);
        if (patterns == null) {
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
        }

        String left = o1.toString();
        Like like = new Like();
        for (String pattern : patterns) {
            if (Boolean.TRUE.equals(like.apply(left, pattern))) {
                return true;
            }
        }
        return false;
    }

    private List<String> toPatterns(Object o2) {
        Object normalized = ValueUtils.normalizeArray(o2);
        if (normalized instanceof List<?> list) {
            List<String> result = new ArrayList<>();
            for (Object o : list) {
                if (o != null) {
                    result.add(o.toString());
                }
            }
            return result;
        }
        if (o2 instanceof String s) {
            List<String> result = new ArrayList<>();
            Collections.addAll(result, s.replace("\n", ",").split(","));
            return result;
        }
        return null;
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
