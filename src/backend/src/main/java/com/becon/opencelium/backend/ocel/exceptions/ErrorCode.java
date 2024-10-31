package com.becon.opencelium.backend.ocel.exceptions;

public enum ErrorCode {
    VP_INVALID_NUMBER_VALUE("incompatible.number.value"),
    VP_UNKNOWN_OPERAND_VALUE("unknown.operand.value"),
    VP_INVALID_ELEMENT_OF_ARRAY("invalid.element.of.array"),
    MISMATCH_ELEMENT_TYPE_OF_ARRAY("mismatch.element.type.of.array"),
    UNSUPPORTED_NUMBER_VALUE("unsupported.number.value"),

    AO_INVALID_TYPE_PAIRS("invalid.type.pairs"),
    AO_INVALID_TYPE("invalid.type"),
    AO_INVALID_OPERAND_VALUE("invalid.operand.value"),

    UNKNOWN_EXCEPTION("unknown.exception")
    ;

    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
