package com.becon.opencelium.backend.exception;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import com.becon.opencelium.backend.constant.ExceptionMessages;
import org.springframework.http.HttpStatus;

public class CategoryValidationException extends RuntimeException {
    private final HttpStatus status;
    private final String error;
    private final String message;

    public CategoryValidationException(HttpStatus status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
    }

    public CategoryValidationException(String error, String message) {
        this(HttpStatus.BAD_REQUEST, error, message);
    }

    public CategoryValidationException(String message) {
        this(HttpStatus.BAD_REQUEST, ExceptionConstant.INVALID_CATEGORY, message);
    }

    public static CategoryValidationException titleAlreadyTaken(String name) {
        return new CategoryValidationException(ExceptionMessages.TITLE_HAS_ALREADY_TAKEN.formatted(name));
    }

    public static CategoryValidationException notFound(Integer id) {
        return new CategoryValidationException(ExceptionConstant.CATEGORY_NOT_FOUND, ExceptionMessages.CATEGORY_NOT_FOUND.formatted(id));
    }

    public static CategoryValidationException invalidCategoryName(String name) {
        return new CategoryValidationException(ExceptionMessages.INVALID_NAME.formatted(name));
    }

    public static CategoryValidationException cycleFound(String cycle) {
        return new CategoryValidationException(ExceptionMessages.CYCLE_FOUND.formatted(cycle));
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
