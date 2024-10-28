package com.becon.opencelium.backend.ocel.utils;

import com.becon.opencelium.backend.constant.RegExpression;

import java.math.BigDecimal;

public class NumberUtils {
    public static int compareTo(Number n1, Number n2) {
        double d1 = n1.doubleValue();
        double d2 = n2.doubleValue();
        return Double.compare(d1, d2);
    }

    public static boolean isNumber(String element) {
        BigDecimal bigDecimal;
        try {
            bigDecimal = new BigDecimal(element);
        } catch (Exception e) {
            return false;
        }

        return bigDecimal.compareTo(BigDecimal.valueOf(Double.MAX_VALUE)) <= 0 &&
                bigDecimal.compareTo(BigDecimal.valueOf(-Double.MAX_VALUE)) >= 0;
    }

    public static boolean isNumberStr(String element) {
        return element.matches(RegExpression.isNumber);
    }
}
