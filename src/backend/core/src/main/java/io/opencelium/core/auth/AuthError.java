package io.opencelium.core.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;

/**
 * The error responses of the authentication endpoints. Each has the problem-details form of RFC 9457 with the extra
 * field {@value #CODE_FIELD}: the HTTP client reads the code, not the text. The text of an error is fixed, so a
 * response never repeats a value of the request.
 */
enum AuthError {

	/** A wrong name or a wrong password, and each login of a deployment mode without a login strategy for it. */
	INVALID_CREDENTIALS("invalid-credentials", HttpStatus.UNAUTHORIZED, "The name or the password is not correct."),

	/** A locked OpenCelium user with the correct password. */
	USER_LOCKED("user-locked", HttpStatus.FORBIDDEN, "The OpenCelium user is locked."),

	/** A login body that is not JSON, that lacks a field, or that has a field that is too long. */
	BAD_REQUEST("bad-request", HttpStatus.BAD_REQUEST,
			"The body must be JSON with a username and a password of at most " + LoginController.MAX_LENGTH
					+ " characters each.");

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
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
		problem.setProperty(CODE_FIELD, code);
		return ResponseEntity.status(status).body(problem);
	}

}
