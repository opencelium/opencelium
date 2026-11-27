package io.opencelium.core.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

/**
 * The error responses of the authentication endpoints, and the response to a refused permission for each endpoint.
 * Each has the problem-details form of RFC 9457 with the extra field {@value #CODE_FIELD}: the HTTP client reads the
 * code, not the text. The text of an error is fixed, so a response never repeats a value of the request.
 */
enum AuthError {

	/** A wrong name or a wrong password, and each login of a deployment mode without a login strategy for it. */
	INVALID_CREDENTIALS("invalid-credentials", HttpStatus.UNAUTHORIZED, "The name or the password is not correct."),

	/**
	 * A request that a permission rule of the access control refuses. The access-denied handler of the main chain
	 * writes it for each endpoint, because the rule refuses the request before the code of the endpoint runs.
	 */
	ACCESS_DENIED("access-denied", HttpStatus.FORBIDDEN, "The OpenCelium user has no permission for this request."),

	/** A locked OpenCelium user with the correct password. */
	USER_LOCKED("user-locked", HttpStatus.FORBIDDEN, "The OpenCelium user is locked."),

	/**
	 * A refresh of a session that does not exist any more: it reached its end, the user logged out, an old refresh
	 * token came again, or the user is locked or deleted. Also an exchange of a login code that was used already, or
	 * for a user that is locked or deleted, and a request for the current user whose user is deleted. The HTTP client
	 * logs in again.
	 */
	SESSION_ENDED("session-ended", HttpStatus.UNAUTHORIZED, "The session ended. Log in again."),

	/** A login body that is not JSON, that lacks a field, or that has a field that is too long. */
	BAD_REQUEST("bad-request", HttpStatus.BAD_REQUEST,
			"The body must be JSON with a username and a password of at most " + LoginController.MAX_LENGTH
					+ " characters each."),

	/**
	 * An exchange of a login code with a login verifier whose hash is not the hash that the login code holds. The
	 * login code stays valid.
	 */
	INVALID_LOGIN_VERIFIER("invalid-login-verifier", HttpStatus.UNAUTHORIZED,
			"The login verifier is not the one of the login that started the login code."),

	/**
	 * An exchange body that is not JSON, that lacks the login verifier, or whose login verifier has another form than
	 * 43 to 128 characters of letters, digits, {@code -}, {@code .}, {@code _} and {@code ~}.
	 */
	BAD_EXCHANGE("bad-request", HttpStatus.BAD_REQUEST,
			"The body must be JSON with a login verifier of 43 to 128 characters: letters, digits, '-', '.', '_' and"
					+ " '~'.");

	static final String CODE_FIELD = "code";

	private final String code;

	private final HttpStatus status;

	private final String detail;

	AuthError(String code, HttpStatus status, String detail) {
		this.code = code;
		this.status = status;
		this.detail = detail;
	}

	String code() {
		return code;
	}

	/** The response with a new problem detail: a problem detail is mutable, so no response shares one. */
	ResponseEntity<ProblemDetail> response() {
		return ResponseEntity.status(status).body(problem());
	}

	/** A new problem detail of this error, with the error code. */
	ProblemDetail problem() {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
		problem.setProperty(CODE_FIELD, code);
		return problem;
	}

}
