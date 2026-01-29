package com.becon.opencelium.backend.ocel.utils;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.Operator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.operators.OperatorFactory;

import java.util.Arrays;

public class OperatorUtils {
    public static boolean isOperator(String token) {
        return OperatorEnum.fromName(token) != null;
    }

    public static Operator getOperator(String token) {
        return OperatorFactory.getOperator(OperatorEnum.fromName(token));
    }

    public static boolean isRightSidedOperator(String token) {
        if (!isOperator(token)) return false;
        Operator operator = getOperator(token);
        return operator.getArity() == Arity.UNARY && !operator.isLeftSided();
    }

    public static boolean isLeftSidedOperator(String token) {
        if (!isOperator(token)) return false;
        Operator operator = getOperator(token);
        return operator.getArity() == Arity.UNARY && operator.isLeftSided();
    }

    public static OperatorEnum findStartingOperator(char[] chars, int i) {
        return Arrays.stream(OperatorEnum.values())
                .sorted((a, b) -> b.getName().length() - a.getName().length())
                .filter(x -> Utils.startsWith(x.getName(), chars, i))
                .findFirst()
                .orElse(null);
    }
}
