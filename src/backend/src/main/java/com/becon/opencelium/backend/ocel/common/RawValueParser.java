package com.becon.opencelium.backend.ocel.common;

import com.becon.opencelium.backend.ocel.exception.*;
import com.becon.opencelium.backend.ocel.operand.OperandUtils;
import com.becon.opencelium.backend.ocel.utils.ReferenceUtils;
import com.becon.opencelium.backend.ocel.utils.Utils;
import com.becon.opencelium.backend.ocel.utils.ValueUtils;
import com.becon.opencelium.backend.utility.PathAndReferenceUtility;

import java.util.ArrayList;
import java.util.List;

public class RawValueParser {
    private static final RawValueParser INSTANCE = new RawValueParser();

    private RawValueParser() {
    }

    public Object parse(String val) throws ValueParseException {
        if (val == null) return null;
        val = val.trim();
        if ("null".equals(val)) return null;

        if ("true".equals(val) || "false".equals(val)) {
            return Boolean.parseBoolean(val);
        }

        // string
        if (val.startsWith("\"") && val.endsWith("\"")) {
            return val.substring(1, val.length() - 1);
        }

        // string
        if (val.startsWith("'") && val.endsWith("'")) {
            return val.substring(1, val.length() - 1);
        }

        if (ValueUtils.isNumberStr(val)) {
            return Double.valueOf(val);
        }

        // array
        if (val.startsWith("[") && val.endsWith("]")) {
            List<String> lines = Utils.splitByOuterCommas(val.substring(1, val.length() - 1));
            return parseList(lines.toArray(new String[0]));
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

        for (String element : elements) {
            parsedList.add(parse(element));
        }

        return parsedList;
    }

    public static RawValueParser getInstance() {
        return INSTANCE;
    }
}
