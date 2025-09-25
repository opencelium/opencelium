package com.becon.opencelium.backend.api.exception;

public class RemoteApiException extends RuntimeException {
    public RemoteApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
