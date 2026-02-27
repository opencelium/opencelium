package com.becon.opencelium.backend.exception;

import com.becon.opencelium.backend.constant.ExceptionConstant;
import org.springframework.http.HttpStatus;

public class TooManyRequestsException extends GeneralServiceException {
    public TooManyRequestsException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, ExceptionConstant.TOO_MANY_ATTEMPTS, message);
    }
}
