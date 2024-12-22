package com.becon.opencelium.backend.ocel.common;

import com.becon.opencelium.backend.ocel.exception.*;
import com.becon.opencelium.backend.ocel.operand.OperandUtils;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;

import java.util.ArrayList;
import java.util.List;

public class RawValueParser {
    private static final RawValueParser INSTANCE = new RawValueParser();

    private RawValueParser() {
    }

    public Object parse(String val) throws ValueParseException {
        if ("null".equals(val)) return null;

        if ("true".equals(val) || "false".equals(val)) {
            return Boolean.parseBoolean(val);
        }

        // string
        if (val.startsWith("\"") && val.endsWith("\"")) {
            return val.substring(1, val.length() - 1);
        }

        if (ValueUtils.isNumberStr(val)) {
            return Double.valueOf(val);
        }

        // array
        if (val.startsWith("[") && val.endsWith("]")) {
            String[] elements = val.substring(1, val.length() - 1).split("\\s*,\\s*");
            return parseList(elements);
        }

        // NUM, ARR, OBJ, STR, BOOL
        if (OperandUtils.checkTypeAvailability(val)) {
            return val;
        }

        throw ValueParseException.unknownOperandValue(val);
    }

    private Object parseList(String[] elements) throws ValueParseException {
        List<Object> parsedList = new ArrayList<>();

        if (elements.length == 1 && elements[0].isEmpty()) {
            // empty array
            return parsedList;
        }

        // all elements' type must be equal
        Class<?> elementType = null;

        for (String element : elements) {
            if (elementType == null) {
                elementType = determineElementType(element);
            }
            parsedList.add(parseElementOfArray(element, elementType));
        }

        return parsedList;
    }

    private Class<?> determineElementType(String element) throws ValueParseException {
        if ("true".equals(element) || "false".equals(element)) {
            return Boolean.class;
        }
        if (ValueUtils.isNumberStr(element)) return Number.class;
        if (element.startsWith("\"") && element.endsWith("\""))
            return String.class;

        throw ValueParseException.invalidElementOfArray(element);
    }

    private Object parseElementOfArray(String element, Class<?> elementType) throws ValueParseException {
        return switch (elementType.getSimpleName()) {
            case "Boolean" -> {
                if ("true".equals(element) || "false".equals(element)) {
                    yield Boolean.parseBoolean(element);
                }
                throw ValueParseException.mismatchElementTypeOfArray(element, elementType);
            }
            case "Number" -> {
                try {
                    yield Double.valueOf(element);
                } catch (NumberFormatException e) {
                    throw ValueParseException.mismatchElementTypeOfArray(element, elementType);
                }
            }
            case "String" -> {
                if (element.startsWith("\"") && element.endsWith("\"")) {
                    yield element.substring(1, element.length() - 1);
                }
                throw ValueParseException.mismatchElementTypeOfArray(element, elementType);
            }
            default -> element;
        };
    }

    public static RawValueParser getInstance() {
        return INSTANCE;
    }
}
