package io.opencelium.core.user;

/**
 * An OIDC login must make a new OpenCelium user with the verified email of its ID token, and another OpenCelium user of
 * the tenant has that email: core makes no user, so the email stays with its owner. The message holds no value of the
 * user and no claim of the ID token, so a log line with it holds no personal data.
 */
public final class EmailTakenException extends RuntimeException {

	EmailTakenException() {
		super("Another OpenCelium user has the verified email of the ID token.");
	}

}
