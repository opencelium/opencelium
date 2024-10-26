package com.becon.opencelium.backend.ocel.postfix.convertor;

import com.becon.opencelium.backend.constant.RegExpression;
import com.becon.opencelium.backend.ocel.enums.DataType;
import com.becon.opencelium.backend.ocel.exceptions.*;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

public class RawValueParser {


    public static Object parse(String val) throws ParseRawValueException {
        if ("null".equals(val)) return null;

        if ("true".equals(val) || "false".equals(val)) {
            return Boolean.parseBoolean(val);
        }

        if (val.startsWith("\"") && val.endsWith("\"")) {
            return val.substring(1, val.length() - 1);
        }

        if (val.matches(RegExpression.isNumber)) {
            return parseNumber(val);
        }

        if (val.startsWith("[") && val.endsWith("]")) {
            String[] elements = val.substring(1, val.length() - 1).split("\\s*,\\s*");
            return parseList(elements);
        }

        if (DataType.checkTypeName(val)) {
            return val;
        }

        throw new InvalidRawValueException();
    }

    private static Object parseNumber(String val) throws ParseRawValueException {
        try {
            return Integer.valueOf(val);
        } catch (NumberFormatException ignored) {
        }
        try {
            return Long.valueOf(val);
        } catch (NumberFormatException ignored) {
        }
        try {
            return Double.valueOf(val);
        } catch (NumberFormatException e) {
            throw new InvalidRawValueException(); //FIXME: detailed message
        }
    }

    private static Object parseList(String[] elements) throws ParseRawValueException {
        List<Object> parsedList = new ArrayList<>();
        if (elements.length == 1 && elements[0].isEmpty()) {
            return parsedList;
        }
        Class<?> elementType = null;

        for (String element : elements) {
            if (elementType == null) {
                elementType = determineElementType(element);
            }
            parsedList.add(parseElement(element, elementType));
        }

        return parsedList;
    }

    private static Class<?> determineElementType(String element) throws ParseRawValueException {
        if ("true".equals(element) || "false".equals(element)) {
            return Boolean.class;
        }
        if (element.matches(RegExpression.isNumber)) {
            if (isInteger(element)) return Integer.class;
            if (isLong(element)) return Long.class;
            if (isDouble(element)) return Double.class;
        }
        if (element.startsWith("\"") && element.endsWith("\"")) {
            return String.class;
        }
        throw new InvalidRawValueException();
    }

    private static Object parseElement(String element, Class<?> elementType) throws ParseRawValueException {
        //FIXME: detailed message
        return switch (elementType.getSimpleName()) {
            case "Boolean" -> {
                if ("true".equals(element) || "false".equals(element)) {
                    yield Boolean.parseBoolean(element);
                }
                throw new DifferentTypeArrayElementsException(); //FIXME: detailed message
            }
            case "Integer" -> parseTypedValue(element, Integer::valueOf);
            case "Long" -> parseTypedValue(element, Long::valueOf);
            case "Double" -> parseTypedValue(element, Double::valueOf);
            case "String" -> {
                if (element.startsWith("\"") && element.endsWith("\"")) {
                    yield element.substring(1, element.length() - 1);
                }
                throw new DifferentTypeArrayElementsException(); //FIXME: detailed message
            }
            default -> throw new DifferentTypeArrayElementsException(); // Handle mismatch
        };
    }

    private static <T> T parseTypedValue(String element, Function<String, T> parser) throws ParseRawValueException {
        try {
            return parser.apply(element);
        } catch (NumberFormatException e) {
            throw new DifferentTypeArrayElementsException();
        }
    }

    private static boolean isInteger(String value) {
        try {
            Integer.parseInt(value);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static boolean isLong(String value) {
        try {
            Long.parseLong(value);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static boolean isDouble(String value) {
        try {
            Double.parseDouble(value);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
