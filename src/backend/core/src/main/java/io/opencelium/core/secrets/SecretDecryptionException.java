package io.opencelium.core.secrets;

/**
 * A secret that does not decrypt: the stored document was changed or copied to another secret ID or owner, or another
 * DEK encrypted it. The message names the secret and never a value.
 */
public final class SecretDecryptionException extends RuntimeException {

	SecretDecryptionException(String message, Throwable cause) {
		super(message, cause);
	}

}
