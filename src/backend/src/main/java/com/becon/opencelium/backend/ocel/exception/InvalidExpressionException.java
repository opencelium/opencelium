package com.becon.opencelium.backend.ocel.exception;

import com.becon.opencelium.backend.ocel.function.FunctionEnum;
import org.apache.commons.lang3.StringUtils;

public class InvalidExpressionException extends Exception {
    private final ErrorCode errorCode;

    public InvalidExpressionException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public static InvalidExpressionException invalidParentheses() {
        return new InvalidExpressionException(ErrorCode.INVALID_PARENTHESES, "Parentheses are invalid");
    }

    public static InvalidExpressionException invalidTokenFound(String token) {
        return new InvalidExpressionException(ErrorCode.INVALID_TOKEN_FOUND, "Invalid token found while reading expression: %s".formatted(token));
    }

    public static InvalidExpressionException unsupportedOperand(String operator, String operand) {
        return new InvalidExpressionException(ErrorCode.UNSUPPORTED_OPERAND, "'%s' operator doesn't support this value : %s".formatted(operator, operand));
    }

    public static InvalidExpressionException invalidAssociationBetweenOperatorAndOperands() {
        return new InvalidExpressionException(ErrorCode.INVALID_ASSOCIATION_BETWEEN_OPERATOR_AND_OPERANDS, "Invalid expression");
    }

    public static InvalidExpressionException insufficientOperand() {
        return new InvalidExpressionException(ErrorCode.INSUFFICIENT_OPERAND, "No sufficient operands");
    }

    public static InvalidExpressionException insufficientOperand(String token) {
        return new InvalidExpressionException(ErrorCode.INSUFFICIENT_OPERAND, "No sufficient operand found for '%s' operator".formatted(token));
    }

    public static InvalidExpressionException valueParseException(ValueParseException e) {
        return new InvalidExpressionException(e.getCode(), e.getMessage());
    }

    public static InvalidExpressionException applyOperatorException(ApplyOperatorException e) {
        return new InvalidExpressionException(e.getCode(), e.getMessage());
    }

    public static InvalidExpressionException unexpectedEndOfExpression(String exp) {
        return new InvalidExpressionException(ErrorCode.UNEXPECTED_END_OF_EXPRESSION, "Invalid end of expression : %s".formatted(exp));
    }

    public static InvalidExpressionException unexpectedException(RuntimeException e) {
        return new InvalidExpressionException(ErrorCode.UNEXPECTED_EXCEPTION, e.getMessage());
    }

    public static InvalidExpressionException referenceExtractorNotFound(String reference) {
        return new InvalidExpressionException(ErrorCode.REFERENCE_EXTRACTOR_NOT_FOUND, "No extractor found for this reference : '%s'".formatted(reference));
    }

    public static InvalidExpressionException cannotExtractReferenceValue(String reference, RuntimeException e) {
        return new InvalidExpressionException(ErrorCode.CANNOT_EXTRACT_REFERENCE, "Exception occurred while getting a value of '%s'. Cause: '%s'".formatted(reference, e.getMessage()));
    }

    public static InvalidExpressionException functionNotFound(String functionName, Object[] args) {
        return new InvalidExpressionException(ErrorCode.FUNCTION_NOT_FOUND, "Function not found : %s(%s)".formatted(functionName, StringUtils.join(args)));
    }

    public static InvalidExpressionException applyFunctionException(ApplyFunctionException e) {
        return new InvalidExpressionException(e.getCode(), e.getMessage());
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
