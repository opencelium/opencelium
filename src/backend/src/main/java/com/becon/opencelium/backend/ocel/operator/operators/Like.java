package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.utils.Utils;

import java.util.regex.Pattern;

class Like implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        // Accept any primitive scalar on both sides and coerce via toString();
        // null remains invalid.
        if (!Utils.isPrimitiveType(o1) || !Utils.isPrimitiveType(o2))
            throw ApplyOperatorException.invalidTypePairsException(getOperatorType(), o1, o2);

        String s1 = o1.toString();
        String s2 = o2.toString();

        // 1. Escape all regex special characters first
        String escaped = Pattern.quote(s2);

        // 2. Pattern.quote wraps the string in \Q...\E.
        // We need to replace the SQL wildcards inside that quoted string.
        String regex = escaped
                .replace("%", "\\E.*\\Q")  // Close quote, add wildcard, reopen quote
                .replace("_", "\\E.\\Q");   // Close quote, add single char wildcard, reopen quote

        // 3. Wrap in anchors
        regex = "^" + regex + "$";

        // Use CASE_INSENSITIVE for SQL-like behavior
        return Pattern.compile(regex, Pattern.CASE_INSENSITIVE | Pattern.DOTALL)
                .matcher(s1)
                .matches(); // Use .matches() for full string matching
    }

    @Override
    public boolean isValidOperand(SidesType sidesType, Object operand) {
        return Utils.isPrimitiveType(operand);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return Utils.isPrimitiveType(type);
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.LIKE;
    }
}
