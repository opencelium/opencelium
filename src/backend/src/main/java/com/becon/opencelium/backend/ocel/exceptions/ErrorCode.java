package com.becon.opencelium.backend.ocel.exceptions;

public enum ErrorCode {
    VP_INVALID_NUMBER_VALUE("incompatible.number.value"),
    VP_UNKNOWN_OPERAND_VALUE("unknown.operand.value"),
    VP_INVALID_ELEMENT_OF_ARRAY("invalid.element.of.array"),
    MISMATCH_ELEMENT_TYPE_OF_ARRAY("mismatch.element.type.of.array"),
    UNSUPPORTED_NUMBER_VALUE("unsupported.number.value"),

    UNSUPPORTED_OPERAND_PAIRS("unsupported.operand.pairs"),
    AO_INVALID_TYPE("invalid.type"),
    AO_INVALID_OPERAND_VALUE("invalid.operand.value"),

    INVALID_SYNTAX("invalid.syntax"),
    UNKNOWN_EXCEPTION("unknown.exception"),
    INVALID_PARENTHESES("invalid.parentheses"),
    INVALID_VALUE_FOUND("invalid.value.found"),

    UNSUPPORTED_OPERAND("unsupported.operand"),
    INVALID_ASSOCIATION_BETWEEN_OPERATOR_AND_OPERANDS("invalid.association.between.operator.and.operand"),
    RESULT_VALUE_IS_NOT_BOOLEAN("result.value.is.not.bool"),
    INSUFFICIENT_OPERAND("insufficient.operand");

    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
