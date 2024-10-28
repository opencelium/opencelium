package com.becon.opencelium.backend.ocel.exceptions;

public class InvalidExpressionException extends Exception {
    public InvalidExpressionException(String message) {
        super(message);
    }

    public InvalidExpressionException() {
    }

    public static InvalidExpressionException valueParseException(ValueParseException e) {
        return new InvalidExpressionException("Error: %s, message: %s".formatted(e.getCode(), e.getMessage()));
    }
}
