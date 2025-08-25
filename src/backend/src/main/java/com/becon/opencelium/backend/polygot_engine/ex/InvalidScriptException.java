package com.becon.opencelium.backend.polygot_engine.ex;

/**
 * Thrown to indicate that a script failed validation due to syntax or structural issues.
 * <p>
 * This exception is typically raised before execution, during the compilation or validation phase.
 */
public class InvalidScriptException extends RuntimeException {
    public InvalidScriptException(String message) {
        super(message);
    }

    public InvalidScriptException(String message, Throwable cause) {
        super(message, cause);
    }
}
