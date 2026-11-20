package io.opencelium.core.auth;

/**
 * A refresh of a session that does not exist any more: the session reached its end, the OpenCelium user logged out,
 * an old refresh token came again, or the OpenCelium user is locked or deleted. Also a request for the current
 * OpenCelium user with the session JWT of a deleted user.
 */
final class SessionEndedException extends RuntimeException {

	/**
	 * @param reason the reason, with the IDs of the session and of its user when the refresh deleted the session
	 *               record or when the user of a session JWT does not exist; never a token
	 */
	SessionEndedException(String reason) {
		super(reason);
	}

}
