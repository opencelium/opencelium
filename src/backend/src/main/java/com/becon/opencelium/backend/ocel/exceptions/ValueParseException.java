package com.becon.opencelium.backend.ocel.exceptions;

public class ValueParseException extends Exception {
    private final ErrorCode code;
    private final String message;

    public ValueParseException(ErrorCode code, String message) {
        this.code = code;
        this.message = message;
    }

    public static ValueParseException invalidElementOfArray(String element) {
        return new ValueParseException(ErrorCode.INVALID_ELEMENT_OF_ARRAY, "Invalid element of an array : " + element);
    }

    public static ValueParseException unknownOperandValue(String val) {
        return new ValueParseException(ErrorCode.UNKNOWN_OPERAND_VALUE, "Unknown operand : " + val);
    }

    public static ValueParseException mismatchElementTypeOfArray(String element, Class<?> elementType) {
        return new ValueParseException(
                ErrorCode.MISMATCH_ELEMENT_TYPE_OF_ARRAY,
                "An element's type is not matched with previous element(s) type - %s : %s"
                        .formatted(elementType.getSimpleName(), element)
        );
    }

    public static ValueParseException unsupportedNumberValue(String val) {
        return new ValueParseException(ErrorCode.UNSUPPORTED_NUMBER_VALUE, "Number is not supported: " + val);
    }

    public String getMessage() {
        return message;
    }

    public String getCode() {
        return code.getCode();
    }
}
