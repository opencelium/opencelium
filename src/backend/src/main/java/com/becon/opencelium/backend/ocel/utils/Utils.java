package com.becon.opencelium.backend.ocel.utils;

import java.util.Objects;

public class Utils {

    private Utils() {
    }

    public static boolean startsWith(String prefix, char[] chars, int i) {
        int length = prefix.length();
        if (chars.length < i + length) {
            return false;
        }
        for (int j = 0; j < length; j++) {
            if (chars[i + j] != prefix.charAt(j)) {
                return false;
            }
        }
        return true;
    }

    public static boolean isPrimitiveType(Class<?> type) {
        return Objects.nonNull(type) && (type.equals(String.class)
                || type.equals(Number.class)
                || type.equals(Boolean.class)
        );
    }

    public static boolean isPrimitiveType(Object operand) {
        return operand instanceof String
                || operand instanceof Number
                || operand instanceof Boolean;
    }
}
