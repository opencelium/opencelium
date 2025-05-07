package com.becon.opencelium.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * This is supposed to be general exception that can be used for any purposes giving {@code status}, {@code error} and {@code message}
 */
public class GeneralServiceException extends RuntimeException {
    private final HttpStatus status;
    private final String error;
    private final String message;

    public GeneralServiceException(HttpStatus status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
    }

    public GeneralServiceException(String error, String message) {
        this(HttpStatus.BAD_REQUEST, error, message);
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
