package com.becon.opencelium.backend.ocel.utils;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public class ValueUtils {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private ValueUtils() {
    }

    /**
     * Returns a List if the object is (or can be parsed as) an array,
     * otherwise returns the object unchanged.
     */
    public static Object normalizeArray(Object o) {
        List<?> parsed = tryParseArray(o);
        return parsed != null ? parsed : o;
    }

    /**
     * Tries to interpret an object as an array. Returns null if it can't.
     * Handles Strings like "[a, b, c]" or JSON arrays like ["a","b","c"].
     */
    public static List<?> tryParseArray(Object o) {
        if (o instanceof List<?>) {
            return (List<?>) o;
        }
        if (!(o instanceof String)) {
            return null;
        }

        String s = ((String) o).trim();
        if (s.length() < 2 || s.charAt(0) != '[' || s.charAt(s.length() - 1) != ']') {
            return null;
        }

        // Try proper JSON parsing first (handles quoted strings, numbers, nested commas, etc.)
        try {
            return OBJECT_MAPPER.readValue(s, List.class);
        } catch (Exception ignored) {
            // Fall back to a naive split for non-JSON strings like "[a, b, c]"
        }

        String inner = s.substring(1, s.length() - 1).trim();
        if (inner.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> result = new ArrayList<>();
        for (String part : inner.split(",")) {
            String trimmed = part.trim();
            if (trimmed.length() >= 2
                    && ((trimmed.startsWith("\"") && trimmed.endsWith("\""))
                    || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
                trimmed = trimmed.substring(1, trimmed.length() - 1);
            }
            result.add(trimmed);
        }
        return result;
    }

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
        if (element == null || element.trim().isEmpty()) {
            return false;
        }

        // Reject numbers with leading zeros (except "0" or decimal formats like "0.5")
        if (element.matches("^-?0[0-9]+.*")) {
            return false;
        }

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
            BigDecimal bd;
            try {
                bd = new BigDecimal(number.trim());

                if (bd.abs().compareTo(BigDecimal.valueOf(Double.MAX_VALUE)) > 0) {
                    throw new RuntimeException("Value exceeds : " + number);
                }

                return bd;
            } catch (Exception e) {
                throw new RuntimeException("Cannot convert " + o + " to a number");
            }
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

    public static String serializeValue(Object value) {
        if (value == null) return "null";

        if (value instanceof Number || value instanceof Boolean || value instanceof String) {
            return value.toString();
        }

        if (value instanceof List<?> list) return serializeList(list);
        if (value instanceof Map<?, ?> map) return serializeMap(map);

        return value.toString();
    }

    private static String serializeValueInList(Object value) {
        if (value == null) return "null";

        if (value instanceof String s) {
            return "\"" + escape(s) + "\"";
        }

        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }

        if (value instanceof List<?> list) return serializeList(list);
        if (value instanceof Map<?, ?> map) return serializeMap(map);

        return "\"" + escape(value.toString()) + "\"";
    }

    private static String serializeValueInMap(Object value) {
        if (value == null) return "null";

        if (value instanceof String s) {
            return "\"" + escape(s) + "\"";
        }

        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }

        if (value instanceof List<?> list) return serializeList(list);
        if (value instanceof Map<?, ?> map) return serializeMap(map);

        return "\"" + escape(value.toString()) + "\"";
    }

    private static String serializeList(List<?> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("[");

        boolean first = true;
        for (Object element : list) {
            if (!first) sb.append(", ");
            first = false;

            sb.append(serializeValueInList(element));
        }

        sb.append("]");
        return sb.toString();
    }

    private static String serializeMap(Map<?, ?> map) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");

        boolean first = true;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (!first) sb.append(", ");
            first = false;

            sb.append("\"")
                    .append(escape(String.valueOf(entry.getKey())))
                    .append("\": ");

            sb.append(serializeValueInMap(entry.getValue()));
        }

        sb.append("}");
        return sb.toString();
    }

    private static String escape(String s) {
        return s
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
