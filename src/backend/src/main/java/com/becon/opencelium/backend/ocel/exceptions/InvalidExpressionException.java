package com.becon.opencelium.backend.ocel.exceptions;

public class InvalidExpressionException extends Exception {
    private final String errorCode;

    public InvalidExpressionException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public static InvalidExpressionException valueParseException(ValueParseException e) {
        return new InvalidExpressionException(e.getCode(), e.getMessage());
    }

    public static InvalidExpressionException applyOperatorException(ApplyOperatorException e) {
        return new InvalidExpressionException(e.getCode(), e.getMessage());
    }

    public String getErrorCode() {
        return errorCode;
    }
}
