package io.opencelium.core.settings;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;

/**
 * The error responses of the settings API. Each has the problem-details form of RFC 9457 with the extra field
 * {@value #CODE_FIELD}: the HTTP client reads the code, not the text. The text of an error is fixed, so a response
 * never repeats a value of the request: a value can be a credential.
 */
enum SettingsError {

	/**
	 * A change with an unknown setting key or a value that is not valid. The field {@value #ERRORS_FIELD} names each
	 * such setting key with its problem.
	 */
	INVALID_SETTINGS("invalid-settings",
			"The change has an unknown setting key or a value that is not valid. The field errors names each one."),

	/** A change whose body is not 1 JSON object. */
	BAD_REQUEST("bad-request", "The body must be 1 JSON object of setting keys and values.");

	static final String CODE_FIELD = "code";

	static final String ERRORS_FIELD = "errors";

	private final String code;

	private final String detail;

	SettingsError(String code, String detail) {
		this.code = code;
		this.detail = detail;
	}

	/** A new problem detail of this error with the status code 400 and the error code. */
	ProblemDetail problem() {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
		problem.setProperty(CODE_FIELD, code);
		return problem;
	}

}
