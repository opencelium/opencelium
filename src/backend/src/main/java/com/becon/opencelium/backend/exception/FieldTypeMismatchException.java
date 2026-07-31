package com.becon.opencelium.backend.exception;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

/**
 * Thrown when a field value's actual type does not match the type expected by the
 * binding/reference path (e.g. the path treats a field as an array while the body
 * stores it as a primitive string).
 * <p>
 * Extends {@link GeneralServiceException} so it is automatically translated into a
 * user-facing {@code ErrorResource} by the global exception handler.
 */
public class FieldTypeMismatchException extends GeneralServiceException {

    private final String fieldPath;
    private final String expectedType;
    private final String actualType;

    public FieldTypeMismatchException(String expectedType, Object actualValue) {
        this(null, expectedType, typeOf(actualValue));
    }

    public FieldTypeMismatchException(String fieldPath, String expectedType, String actualType) {
        super(HttpStatus.BAD_REQUEST, ExceptionConstant.INVALID_DATA, buildMessage(fieldPath, expectedType, actualType));
        this.fieldPath = fieldPath;
        this.expectedType = expectedType;
        this.actualType = actualType;
    }

    /**
     * Returns a copy of this exception enriched with the field path, used when the
     * concrete field is only known by an outer caller (the cast site only knows the
     * expected and actual types).
     */
    public FieldTypeMismatchException withFieldPath(String fieldPath) {
        return this.fieldPath != null ? this : new FieldTypeMismatchException(fieldPath, expectedType, actualType);
    }

    private static String buildMessage(String fieldPath, String expectedType, String actualType) {
        return fieldPath == null
                ? "Field type mismatch: expected '%s' but found '%s'.".formatted(expectedType, actualType)
                : "Field type mismatch for field '%s': expected '%s' but found '%s'.".formatted(fieldPath, expectedType, actualType);
    }

    /**
     * Returns a human-readable JSON-oriented type name for the given value, used in
     * type-mismatch error messages.
     */
    private static String typeOf(Object value) {
        if (value == null) {
            return "null";
        } else if (value instanceof List<?>) {
            return "array";
        } else if (value instanceof Map<?, ?>) {
            return "object";
        } else if (value instanceof String) {
            return "string";
        } else if (value instanceof Boolean) {
            return "boolean";
        } else if (value instanceof Number) {
            return "number";
        }
        return value.getClass().getSimpleName();
    }
}