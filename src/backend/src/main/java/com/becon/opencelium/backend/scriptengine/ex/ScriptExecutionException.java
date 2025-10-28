package com.becon.opencelium.backend.scriptengine.ex;

/**
 * Thrown to indicate that an error occurred during script execution.
 * <p>
 * This exception typically wraps evaluation errors raised while executing a script via a {@code ScriptEngine}.
 */
public class ScriptExecutionException extends RuntimeException {
    public ScriptExecutionException(String message) {
        super(message);
    }

    public ScriptExecutionException(String message, Throwable cause) {
        super(message, cause);
    }
}
