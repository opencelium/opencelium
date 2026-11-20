package io.opencelium.core.auth;

/**
 * A refresh of a session that does not exist any more: the session reached its end, the OpenCelium user logged out,
 * an old refresh token came again, or the OpenCelium user is locked or deleted.
 */
final class SessionEndedException extends RuntimeException {

	/**
	 * @param reason the reason, with the IDs of the session and of its user when the refresh deleted the session
	 *               record; never a token
	 */
	SessionEndedException(String reason) {
		super(reason);
	}

}
