package com.becon.opencelium.backend.exception;

import org.springframework.http.HttpStatus;

public class ServiceUnavailableException extends GeneralServiceException {
    public ServiceUnavailableException(String error, String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, error, message);
    }
}
