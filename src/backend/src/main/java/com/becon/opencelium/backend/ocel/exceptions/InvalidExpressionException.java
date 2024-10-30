package com.becon.opencelium.backend.ocel.exceptions;

public class InvalidExpressionException extends Exception {
    public InvalidExpressionException(String message) {
        super(message);
    }

    public InvalidExpressionException() {
    }

    public static InvalidExpressionException valueParseException(ValueParseException e) {
        return new InvalidExpressionException("Cannot read operand. code - %s, message - %s".formatted(e.getCode(), e.getMessage()));
    }

    public static InvalidExpressionException applyOperatorException(ApplyOperatorException e) {
        return new InvalidExpressionException(); // TODO: build detailed message
    }
}
