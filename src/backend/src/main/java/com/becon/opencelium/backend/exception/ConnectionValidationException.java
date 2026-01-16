package com.becon.opencelium.backend.exception;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import com.becon.opencelium.backend.ocel.exception.InvalidExpressionException;
import org.springframework.http.HttpStatus;

public class ConnectionValidationException extends RuntimeException {
    private final HttpStatus status;
    private final String error;
    private final String message;

    public ConnectionValidationException(HttpStatus status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
    }

    public ConnectionValidationException(String error, String message) {
        this(HttpStatus.BAD_REQUEST, error, message);
    }

    public ConnectionValidationException(String message) {
        this(HttpStatus.BAD_REQUEST, ExceptionConstant.INVALID_CONNECTION, message);
    }

    public static ConnectionValidationException titleAlreadyTaken(String title) {
        return new ConnectionValidationException(ExceptionMessages.TITLE_HAS_ALREADY_TAKEN.formatted(title));
    }

    public static ConnectionValidationException connectorNotFound(Integer id) {
        return new ConnectionValidationException(ExceptionConstant.CONNECTOR_NOT_FOUND, ExceptionMessages.CONNECTOR_NOT_FOUND.formatted(id == null ? null : id.toString()));
    }

    public static ConnectionValidationException connectionNotFound(Long connectionId) {
        return new ConnectionValidationException(ExceptionConstant.CONNECTION_NOT_FOUND, ExceptionMessages.CONNECTION_NOT_FOUND.formatted(connectionId == null ? null : connectionId.toString()));
    }

    public static ConnectionValidationException connectionAlreadyExists(Long connectionId) {
        return new ConnectionValidationException(ExceptionMessages.CONNECTION_ALREADY_EXISTS.formatted(connectionId == null ? null : connectionId.toString()));
    }

    public static ConnectionValidationException invalidReference(String ref) {
        return new ConnectionValidationException(ExceptionMessages.INVALID_REFERENCE.formatted(ref));
    }

    public static ConnectionValidationException methodNotFound(String id) {
        return new ConnectionValidationException(ExceptionMessages.METHOD_NOT_FOUND.formatted(id));
    }

    public static ConnectionValidationException invalidExpression(String exp, InvalidExpressionException e) {
        return new ConnectionValidationException("Invalid Expression - %s. code - %s, error - %s".formatted(exp, e.getErrorCode().getCode(), e.getMessage()));
    }

    public static ConnectionValidationException operatorNotFound(String id) {
        return new ConnectionValidationException(ExceptionMessages.OPERATOR_NOT_FOUND.formatted(id));
    }

    public static ConnectionValidationException enhancementNotFound(String id) {
        return new ConnectionValidationException(ExceptionMessages.ENHANCEMENT_NOT_FOUND.formatted(id));
    }

    public static ConnectionValidationException unknownError(String message) {
        return new ConnectionValidationException(ExceptionConstant.UNKNOWN_ERROR, message);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }

    @Override
    public String getMessage() {
        return message;
    }
}
