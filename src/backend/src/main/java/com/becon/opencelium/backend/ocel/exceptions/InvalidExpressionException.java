package com.becon.opencelium.backend.ocel.exceptions;

public class InvalidExpressionException extends Exception {
    private final String errorCode;

    public InvalidExpressionException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public static InvalidExpressionException valueParseException(ValueParseException e) {
        return new InvalidExpressionException(e.getCodeString(), e.getMessage());
    }

    public static InvalidExpressionException applyOperatorException(ApplyOperatorException e) {
        return new InvalidExpressionException(e.getCodeString(), e.getMessage());
    }

    public static InvalidExpressionException invalidSyntaxException() {
        return new InvalidExpressionException(ErrorCode.INVALID_SYNTAX.getCode(), "Invalid Expression");
    }

    public static InvalidExpressionException invalidSyntaxException(InvalidSyntaxException e) {
        return new InvalidExpressionException(e.getErrorCode().getCode(), e.getMessage());
    }

    public static InvalidExpressionException invalidAssociationBetweenOperandAndOperators() {
        return new InvalidExpressionException(ErrorCode.INVALID_ASSOCIATION_BETWEEN_OPERATOR_AND_OPERANDS.getCode(), "Invalid expression");
    }

    public static InvalidExpressionException resultValueIsNotBoolean(Object resultVal) {
        return new InvalidExpressionException(ErrorCode.RESULT_VALUE_IS_NOT_BOOLEAN.getCode(), resultVal.toString());
    }

    public static InvalidExpressionException insufficientOperandException() {
        return new InvalidExpressionException(ErrorCode.INSUFFICIENT_OPERAND.getCode(), "No sufficient operands");
    }

    public String getErrorCode() {
        return errorCode;
    }
}
