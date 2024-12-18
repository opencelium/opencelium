package com.becon.opencelium.backend.ocel.operator;

import com.becon.opencelium.backend.ocel.common.Utils;

import java.util.ArrayList;
import java.util.List;

public class OperatorUtils {
    private static final List<String> independentOperators;

    static {
        independentOperators = new ArrayList<>();
        independentOperators.add(OperatorEnum.AND.getName());
        independentOperators.add(OperatorEnum.OR.getName());
        independentOperators.add(OperatorEnum.GREATER_THAN_OR_EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.GREATER_THAN.getName());
        independentOperators.add(OperatorEnum.LESS_THAN_OR_EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.LESS_THAN.getName());
        independentOperators.add(OperatorEnum.NOT_EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.EQUAL_TO.getName());
        independentOperators.add(OperatorEnum.NOT.getName());
    }

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

    public static String findStartingOperator(char[] chars, int i) {
        for (String op : independentOperators)
            if (Utils.startsWith(op, chars, i))
                return op;
        return null;
    }

    public static boolean startsWithOperator(char[] chars, int i) {
        return findStartingOperator(chars, i) != null;
    }
}
