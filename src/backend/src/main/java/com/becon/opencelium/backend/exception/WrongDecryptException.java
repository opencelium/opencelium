package com.becon.opencelium.backend.exception;

public class WrongDecryptException extends RuntimeException{

    public WrongDecryptException(Throwable cause) {
        super(cause);
    }

    public WrongDecryptException(String message) {
        super(message);
    }

    public WrongDecryptException(String message, Throwable cause) {
        super(message, cause);
    }
}
