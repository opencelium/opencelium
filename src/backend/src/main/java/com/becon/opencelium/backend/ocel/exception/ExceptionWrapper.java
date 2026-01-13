package com.becon.opencelium.backend.ocel.exception;

public class ExceptionWrapper extends RuntimeException {
    private final Exception originalException;

    public ExceptionWrapper(Exception originalException) {
        super(originalException);
        this.originalException = originalException;
    }

    public Exception getOriginalException() {
        return originalException;
    }
}
