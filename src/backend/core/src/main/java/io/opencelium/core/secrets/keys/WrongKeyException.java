package io.opencelium.core.secrets.keys;

/**
 * GCM authentication of a stored key failed: the root key is not the one that wrapped the data key, the system data
 * key is not the one that encrypted the signing key, or the stored document was changed (for example moved to another
 * tenant or to another version).
 */
public final class WrongKeyException extends RuntimeException {

	WrongKeyException(String message, Throwable cause) {
		super(message, cause);
	}

}
