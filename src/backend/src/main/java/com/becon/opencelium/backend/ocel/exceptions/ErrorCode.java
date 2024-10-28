package com.becon.opencelium.backend.ocel.exceptions;

public enum ErrorCode {
    INVALID_NUMBER_VALUE("incompatible.number.value"),
    UNKNOWN_OPERAND_VALUE("unknown.operand.value"),
    INVALID_ELEMENT_OF_ARRAY("invalid.element.of.array"),
    MISMATCH_ELEMENT_TYPE_OF_ARRAY("mismatch.element.type.of.array"),
    UNSUPPORTED_NUMBER_VALUE("unsupported.number.value");

    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
