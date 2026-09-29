package io.opencelium.core.secrets.keys;

/**
 * GCM authentication of a wrapped data key failed: the root key is not the one that wrapped it, or the stored
 * document was changed (for example moved to another tenant).
 */
public final class WrongKeyException extends RuntimeException {

	WrongKeyException(String message, Throwable cause) {
		super(message, cause);
	}

}
