package com.becon.opencelium.backend.ocel.operand;

import com.becon.opencelium.backend.ocel.utils.ValueUtils;
import com.becon.opencelium.backend.reference.ReferenceMatchers;
import com.becon.opencelium.backend.reference.enums.ReferenceGroup;

import java.util.List;

public class OperandUtils {
    public static boolean isOperand(String token) {
        return "null".equals(token)
                || "true".equals(token)
                || "false".equals(token)
                || ReferenceMatchers.isReference(token, ReferenceGroup.WRAPPED)
                || ValueUtils.isString(token)
                || ValueUtils.isNumberStr(token)
                || ValueUtils.isArray(token)
                || checkTypeAvailability(token);
    }

    public static Class<?> getClassByType(String type) {
        return switch (type) {
            case "NUM" -> Number.class;
            case "ARR" -> List.class;
            case "OBJ" -> Object.class;
            case "STR" -> String.class;
            case "BOOL" -> Boolean.class;
            default -> null;
        };
    }

    public static boolean checkTypeAvailability(String typeName) {
        return getClassByType(typeName) != null;
    }
}
