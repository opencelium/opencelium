package io.opencelium.common.secret;

/** Base type for every failure a {@link SecretProvider} reports. */
public abstract class SecretException extends RuntimeException {

    protected SecretException(String message) {
        super(message);
    }

    protected SecretException(String message, Throwable cause) {
        super(message, cause);
    }
}
