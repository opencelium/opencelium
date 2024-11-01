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
        return new InvalidSyntaxException(ErrorCode.INVALID_VALUE_FOUND, "Invalid value found while reading expression: '%s'".formatted(token));
    }

    public static InvalidSyntaxException valueParseException(ValueParseException e) {
        return new InvalidSyntaxException(e.getCode(), e.getMessage());
    }

    public static InvalidSyntaxException applyOperatorException(ApplyOperatorException e) {
        return new InvalidSyntaxException(e.getCode(), e.getMessage());
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
