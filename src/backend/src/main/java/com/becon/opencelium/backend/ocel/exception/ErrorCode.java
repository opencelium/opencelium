package com.becon.opencelium.backend.ocel.exception;

public enum ErrorCode {
    // raw value parser
    VP_INVALID_NUMBER_VALUE("incompatible.number.value"),
    VP_INVALID_ELEMENT_OF_ARRAY("invalid.element.of.array"),
    VP_MISMATCH_ELEMENT_TYPE_OF_ARRAY("mismatch.element.type.of.array"),

    // apply methods
    AO_INVALID_OPERAND_PAIRS("invalid.operand.pairs"),
    AO_INVALID_TYPE("invalid.type"),
    AO_INVALID_OPERAND_VALUE("invalid.operand.value"),

    INVALID_TOKEN_FOUND("invalid.token.found"),
    INVALID_PARENTHESES("invalid.parentheses"),

    UNSUPPORTED_OPERAND("unsupported.operand"),
    INSUFFICIENT_OPERAND("insufficient.operand"),
    INVALID_ASSOCIATION_BETWEEN_OPERATOR_AND_OPERANDS("invalid.association.between.operator.and.operand"),

    RESULT_VALUE_IS_NOT_BOOLEAN("result.value.is.not.bool"),
    UNEXPECTED_END_OF_EXPRESSION("unexpected.end.of.expression"),
    UNEXPECTED_EXCEPTION("unexpected.exception"),

    REFERENCE_EXTRACTOR_NOT_FOUND("reference.extractor.not.found"),
    CANNOT_EXTRACT_REFERENCE("cannot.extract.reference"),
    FUNC_INVALID_PARAM_LIST("invalid.param.list"),
    FUNCTION_NOT_FOUND("function.not.found"),;

    private final String code;

    ErrorCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
