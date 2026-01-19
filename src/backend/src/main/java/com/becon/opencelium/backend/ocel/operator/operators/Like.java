package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.Arity;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;

import java.util.regex.Pattern;

public class Like implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
//        if (!(o1 instanceof String s1) || !(o2 instanceof String s2))
//            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);
//
//        String regex = "(?i)^" + s2.replace("%", ".*") + "$";
//        return Pattern.compile(regex, Pattern.DOTALL).matcher(s1).find();

        if (!(o1 instanceof String s1) || !(o2 instanceof String s2))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

        // 1. Escape all regex special characters first
        String escaped = Pattern.quote(s2);

        // 2. Pattern.quote wraps the string in \Q...\E.
        // We need to replace the SQL wildcards inside that quoted string.
        String regex = escaped
                .replace("%", "\\E.*\\Q")  // Close quote, add wildcard, reopen quote
                .replace("_", "\\E.\\Q");   // Close quote, add single char wildcard, reopen quote

        // 3. Clean up empty quotes and wrap in anchors
        regex = "^" + regex + "$";

        // Use CASE_INSENSITIVE for SQL-like behavior
        return Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.DOTALL)
                .matcher(s1)
                .matches(); // Use .matches() for full string matching
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return operand instanceof String;
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return type.equals(String.class);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.LIKE;
    }
}
