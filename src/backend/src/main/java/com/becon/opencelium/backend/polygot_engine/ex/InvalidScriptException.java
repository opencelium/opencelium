package com.becon.opencelium.backend.polygot_engine.ex;

public class InvalidScriptException extends RuntimeException {
    public InvalidScriptException(String message) {
        super(message);
    }

    public InvalidScriptException(String message, Throwable cause) {
        super(message, cause);
    }
}
