package com.becon.opencelium.backend.ocel.utils;

import java.math.BigDecimal;

public class ValueUtils {

    private ValueUtils() {}

    public static double compareTo(Number n1, Number n2) {
        if (n1 == null || n2 == null) return n1 == null ? -n2.doubleValue() : n1.doubleValue();
        double d1 = n1.doubleValue();
        double d2 = n2.doubleValue();
        return Double.compare(d1, d2);
    }

    public static double compareTo(Object n1, Object n2) {
        return compareTo(parseNumber(n1), parseNumber(n2));
    }

    public static boolean isNumberStr(String element) {
        BigDecimal bigDecimal;
        try {
            bigDecimal = new BigDecimal(element);
        } catch (Exception e) {
            return false;
        }

        return bigDecimal.compareTo(BigDecimal.valueOf(Double.MAX_VALUE)) <= 0 &&
                bigDecimal.compareTo(BigDecimal.valueOf(-Double.MAX_VALUE)) >= 0;
    }

    public static boolean isNumber(Object o) {
        if (o instanceof Number) return true;
        if (o instanceof String str) return isNumberStr(str);
        return false;
    }

    private static Number parseNumber(Object o) {
        if (o instanceof Integer i) {
            return i;
        } else if (o instanceof Long l) {
            return l;
        } else if (o instanceof Float f) {
            return f;
        } else if (o instanceof Double d) {
            return d;
        } else if (o instanceof String number) {
            if (number.contains(".")) {
                return Double.parseDouble(number);
            }
            return Integer.parseInt(number);
        }
        throw new RuntimeException("Cannot convert " + o + " to a number");
    }

    public static boolean parseBoolean(Object o) {
        if (o instanceof Boolean) return ((Boolean) o);
        if (o instanceof String) return Boolean.parseBoolean((String) o);
        throw new RuntimeException("Cannot convert " + o + " to a boolean");
    }

    public static boolean isBool(Object o1) {
        return o1 instanceof Boolean
                || o1 instanceof String str && ("true".equals(str) || "false".equals(str));
    }

    public static boolean isString(String x) {
        return x.startsWith("\"") && x.endsWith("\"") || x.startsWith("'") && x.endsWith("'");
    }

    public static boolean isArray(String x) {
        return x.startsWith("[") && x.endsWith("]");
    }
}
