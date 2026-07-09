package com.becon.opencelium.backend.ocel.operator.operators;

import com.becon.opencelium.backend.ocel.exception.ApplyOperatorException;
import com.becon.opencelium.backend.ocel.operator.BinaryOperator;
import com.becon.opencelium.backend.ocel.operator.OperatorEnum;
import com.becon.opencelium.backend.ocel.operator.SidesType;
import com.becon.opencelium.backend.ocel.utils.Utils;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

class ContainsSubStr implements BinaryOperator {
    @Override
    public Object apply(Object o1, Object o2) throws ApplyOperatorException {
        // Normalize: convert String operands that contain arrays into real Lists
        o1 = normalize(o1);
        o2 = normalize(o2);

        List<?> values;
        Object value;

        if (isArrayLeft(o1, o2)) {
            value = o2;
            values = (List<?>) o1;
        } else if (isArrayRight(o1, o2)) {
            value = o1;
            values = (List<?>) o2;
        } else if (isUnaryRight(o2)) {
            List<?> list = (List<?>) o2;
            values = (List<?>) list.get(1);
            value = list.get(0);
        } else {
            throw ApplyOperatorException.invalidOperandValueException(getOperatorType(), o1, o2);
        }

        for (Object o : values) {
            if (o != null && o.toString().contains(value.toString())) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns a List if the object is (or can be parsed as) an array,
     * otherwise returns the object unchanged.
     */
    private Object normalize(Object o) {
        List<?> parsed = tryParseArray(o);
        return parsed != null ? parsed : o;
    }

    /**
     * Tries to interpret an object as an array. Returns null if it can't.
     * Handles Strings like "[a, b, c]" or JSON arrays like ["a","b","c"].
     */
    private List<?> tryParseArray(Object o) {
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
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(s, List.class);
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

    private boolean isUnaryRight(Object o2) {
        return o2 instanceof List<?> list && list.get(0) instanceof String && list.get(1) instanceof List<?>;
    }

    private boolean isArrayRight(Object o1, Object o2) {
        return o2 instanceof List<?> list && o1 instanceof String && isStringArray(list);
    }

    private boolean isStringArray(List<?> list) {
        for (Object o : list) {
            if (!(o instanceof String)) {
                return false;
            }
        }
        return true;
    }

    private boolean isArrayLeft(Object o1, Object o2) {
        return o1 instanceof List<?> && o2 instanceof String;
    }

    @Override
    public OperatorEnum getOperatorType() {
        return OperatorEnum.CONTAINS_SUB_STR;
    }

    @Override
    public boolean isValidOperand(SidesType side, Object operand) {
        if (side == SidesType.LEFT)
            return Objects.isNull(operand) || operand instanceof List<?> || operand instanceof String;

        return Objects.nonNull(operand) && (operand instanceof String || operand instanceof List<?>);
    }

    @Override
    public boolean isValidType(SidesType side, Class<?> type) {
        return side == SidesType.LEFT
                ? Objects.isNull(type) || type.equals(List.class) || type.equals(String.class)
                : type.equals(String.class) || type.equals(List.class);
    }
}
