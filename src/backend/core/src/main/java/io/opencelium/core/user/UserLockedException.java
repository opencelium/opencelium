package io.opencelium.core.user;

/**
 * The OpenCelium user that an OIDC login finds is locked, so core starts no session for it. The message holds no value
 * of the user and no claim of the ID token, so a log line with it holds no personal data.
 */
public final class UserLockedException extends RuntimeException {

	UserLockedException() {
		super("The OpenCelium user of the OIDC login is locked.");
	}

}
