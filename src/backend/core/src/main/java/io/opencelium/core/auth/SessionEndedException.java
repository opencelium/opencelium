package io.opencelium.core.auth;

/**
 * A refresh of a session that does not exist any more: the session reached its end, the OpenCelium user logged out,
 * an old refresh token came again, or the OpenCelium user is locked or deleted.
 */
final class SessionEndedException extends RuntimeException {

	/** @param reason the reason, without a token and without a value of the request */
	SessionEndedException(String reason) {
		super(reason);
	}

}
