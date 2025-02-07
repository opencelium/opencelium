package com.becon.opencelium.backend.ocel.utils;

import java.util.ArrayList;
import java.util.List;
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


    public static List<String> splitByOuterCommas(String val) {
        List<String> result = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        int bracketLevel = 0;
        boolean withinQuote = false;

        for (int i = 0; i < val.length(); i++) { // Skip outer brackets
            char c = val.charAt(i);

            if (c == '[') {
                bracketLevel++;
            } else if (c == ']') {
                bracketLevel--;
            } else if (c == '"') {
                withinQuote = !withinQuote;
            } else if (c == ',' && bracketLevel == 0 && !withinQuote) {
                result.add(current.toString().trim());
                current.setLength(0);
                continue;
            }

            current.append(c);
        }

        if (!current.isEmpty()) {
            result.add(current.toString().trim());
        }

        return result;
    }
}
