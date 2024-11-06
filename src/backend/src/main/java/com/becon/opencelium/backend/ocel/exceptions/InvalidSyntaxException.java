package com.becon.opencelium.backend.ocel.exceptions;

public class InvalidSyntaxException extends Exception {
    private final ErrorCode errorCode;

    public InvalidSyntaxException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public static InvalidSyntaxException invalidParentheses() {
        return new InvalidSyntaxException(ErrorCode.INVALID_PARENTHESES, "Parentheses are invalid");
    }

    public static InvalidSyntaxException invalidValueFoundException(String token) {
        return new InvalidSyntaxException(ErrorCode.INVALID_VALUE_FOUND, "Invalid value found while reading expression: %s".formatted(token));
    }

    public static InvalidSyntaxException valueParseException(ValueParseException e) {
        return new InvalidSyntaxException(e.getCode(), e.getMessage());
    }

    public static InvalidSyntaxException applyOperatorException(ApplyOperatorException e) {
        return new InvalidSyntaxException(e.getCode(), e.getMessage());
    }

    public static InvalidSyntaxException unknownException(String message) {
        return new InvalidSyntaxException(ErrorCode.UNKNOWN_EXCEPTION, message);
    }

    public static InvalidSyntaxException unsupportedOperandException(String operator, String operand) {
        return new InvalidSyntaxException(ErrorCode.UNSUPPORTED_OPERAND, "'%s' operator doesn't support this value : %s".formatted(operator, operand));
    }

    public static InvalidSyntaxException invalidAssociationBetweenOperatorAndOperands() {
        return new InvalidSyntaxException(ErrorCode.INVALID_ASSOCIATION_BETWEEN_OPERATOR_AND_OPERANDS, "Invalid expression");
    }

    public static InvalidSyntaxException resultValueIsNotBoolean(Object resultValue) {
        return new InvalidSyntaxException(ErrorCode.RESULT_VALUE_IS_NOT_BOOLEAN, resultValue.toString());
    }

    public static InvalidSyntaxException insufficientOperandException() {
        return new InvalidSyntaxException(ErrorCode.INSUFFICIENT_OPERAND, "No sufficient operands");
    }

    public static InvalidSyntaxException insufficientOperandException(String token) {
        return new InvalidSyntaxException(ErrorCode.INSUFFICIENT_OPERAND, "No sufficient operand found for '%s' operator".formatted(token));
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
