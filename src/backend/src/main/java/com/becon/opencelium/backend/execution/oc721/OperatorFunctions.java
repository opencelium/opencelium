package com.becon.opencelium.backend.execution.oc721;

import com.becon.opencelium.backend.resource.execution.DataType;
import com.becon.opencelium.backend.resource.execution.SchemaDTO;
import org.apache.commons.lang3.StringUtils;

import java.util.regex.Pattern;

public class OperatorFunctions {
    public static boolean equalTo(SchemaDTO val1, SchemaDTO val2) {
        if (val1 == null || val2 == null) {
            return false;
        }

        return StringUtils.equals(val1.getValue(), val2.getValue()) &&
                StringUtils.equals(val1.getItems().toString(), val2.getItems().toString()) &&
                StringUtils.equals(val1.getProperties().toString(), val2.getProperties().toString());
    }

    public static boolean notEqualTo(SchemaDTO val1, SchemaDTO val2) {
        return !equalTo(val1, val2);
    }

    public static boolean greaterThan(SchemaDTO val1, SchemaDTO val2) {
        double d1 = convertToDouble(val1, ">");
        double d2 = convertToDouble(val2, ">");

        return d1 > d2;
    }

    public static boolean greaterThanOrEqualTo(SchemaDTO val1, SchemaDTO val2) {
        double d1 = convertToDouble(val1, ">=");
        double d2 = convertToDouble(val2, ">=");

        return d1 >= d2;
    }

    public static boolean isEmpty(SchemaDTO val1, SchemaDTO val2) {
        if (val1.getType() != DataType.ARRAY) {
            throw new RuntimeException("isEmpty() would be used with an Array");
        }

        return val1.getItems().isEmpty();
    }

    public static boolean isNotEmpty(SchemaDTO val1, SchemaDTO val2) {
        if (val1.getType() != DataType.ARRAY) {
            throw new RuntimeException("isNotEmpty() would be used with an Array");
        }

        return !val1.getItems().isEmpty();
    }

    public static boolean isNull(SchemaDTO val1, SchemaDTO val2) {
        return val1 == null || (val1.getValue() == null && val1.getItems() == null && val1.getProperties() == null);
    }

    public static boolean isNotNull(SchemaDTO val1, SchemaDTO val2) {
        return val1 != null && (val1.getValue() != null || val1.getItems() != null || val1.getProperties() != null);
    }

    public static boolean isTypeOf(SchemaDTO val1, SchemaDTO val2) {
        return val1.getType() == DataType.getEnumType(val2.getValue());
    }

    public static boolean lessThan(SchemaDTO val1, SchemaDTO val2) {
        return !greaterThanOrEqualTo(val1, val2);
    }

    public static boolean lessThanOrEqualTo(SchemaDTO val1, SchemaDTO val2) {
        return !greaterThan(val1, val2);
    }

    public static boolean like(SchemaDTO val1, SchemaDTO val2) {
        if (val1.getType() != DataType.STRING || val2.getType() != DataType.STRING) {
            throw new RuntimeException("Operator 'LIKE' works only with STRING");
        }

        String regex = "^" + (val2.getValue()).replace("_", ".").replace("%", ".*") + "$";
        return Pattern.matches(regex, val1.getValue());
    }

    public static boolean notLike(SchemaDTO val1, SchemaDTO val2) {
        return !like(val1, val2);
    }

    public static boolean matches(SchemaDTO val1, SchemaDTO val2) {
        if (val1.getType() != DataType.STRING || val2.getType() != DataType.STRING) {
            throw new RuntimeException("Operator 'MATCHES' works only with STRING");
        }

        return Pattern.matches(val1.getValue(), val2.getValue());
    }

    public static boolean matchesInList(SchemaDTO val1, SchemaDTO val2) {
        if (val1.getType() != DataType.STRING || val2.getType() != DataType.ARRAY) {
            throw new RuntimeException("Operator 'MATCHES_IN_LIST' works with STRING and ARRAY");
        }

        if (val2.getItems() == null) {
            return false;
        }

        for (SchemaDTO schema : val2.getItems()) {
            if (matches(val1, schema)) {
                return true;
            }
        }

        return false;
    }

    public static boolean regEx(SchemaDTO val1, SchemaDTO val2) {
        if (val1.getType() != DataType.STRING || val2.getType() != DataType.STRING) {
            throw new RuntimeException("Operator 'REG_EX' works only with STRING");
        }

        return Pattern.matches(val2.getValue(), val1.getValue());
    }

    public static boolean propertyExists(SchemaDTO val1, SchemaDTO val2) {
        if (val1 == null || val1.getType() != DataType.OBJECT || val1.getProperties() == null) {
            return false;
        }

        return val1.getProperties().containsKey(val2.getValue());
    }

    public static boolean propertyNotExists(SchemaDTO val1, SchemaDTO val2) {
        return !propertyExists(val1, val2);
    }

    public static boolean contains(SchemaDTO val1, SchemaDTO val2) {
        return true;
    }

    public static boolean notContains(SchemaDTO val1, SchemaDTO val2) {
        return true;
    }

    public static boolean containsSubStr(SchemaDTO val1, SchemaDTO val2) {
        return true;
    }

    public static boolean notContainsSubStr(SchemaDTO val1, SchemaDTO val2) {
        return true;
    }

    private static double convertToDouble(SchemaDTO schema, String operand) {
        if (schema.getType() != DataType.NUMBER && schema.getType() != DataType.INTEGER) {
            throw new RuntimeException("Operator '" + operand + "' works only with INTEGER or NUMBER");
        }
        String value = schema.getValue();

        if (value.contains(".")) {
            return Double.parseDouble(value);
        }

        return Integer.parseInt(value);
    }
}
