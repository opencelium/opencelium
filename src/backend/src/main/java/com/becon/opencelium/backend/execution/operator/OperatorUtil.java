package com.becon.opencelium.backend.execution.operator;

public class OperatorUtil {

    public static double convertToDouble(Object o, String operator) {
        if (o instanceof Integer) {
            return (int) o;
        } else if (o instanceof Long) {
            return (long) o;
        } else if (o instanceof Float) {
            return (float) o;
        } else if (o instanceof Double) {
            return (double) o;
        } else if (o instanceof String number) {
            if (number.contains(".")) {
                return Double.parseDouble(number);
            }

            return Integer.parseInt(number);
        } else {
            throw new RuntimeException(operator + " only supports Number values");
        }
    }
}
