package io.opencelium.core.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * The exchange of the login code of a redirect login for the 2 tokens of its session. The endpoint takes the login code
 * as the bearer token and the login verifier in the body, and it needs no session JWT: the login-code chain
 * authenticates the login code, and its login holds the token. A request without a valid login code never reaches
 * this class; it gets the answer of the chain. A refused exchange gets an error response with a code
 * ({@link AuthError}):
 * <ul>
 * <li>A login verifier whose hash is not the hash of the login code gets {@code invalid-login-verifier}, and the login
 * code stays valid.</li>
 * <li>A login code that was used already, and a locked or deleted OpenCelium user, get {@code session-ended}.</li>
 * <li>A body that is not JSON, without a login verifier, or with a login verifier of another form than
 * {@value #LOGIN_VERIFIER_FORM} gets {@code bad-request}, and the login code stays valid. The form has at least 43
 * characters, so that a login verifier cannot be guessed from the hash in the login code, which the browser can read.
 * It has only ASCII characters, so that the hash of a character outside ASCII does not equal the hash of another
 * character.</li>
 * </ul>
 * Each refused exchange writes 1 line to the log with the code and a reason that holds no value of the request: never
 * the login code, the login verifier, its hash or a token.
 */
@RestController
final class LoginCodeController {

	static final String PATH = "/api/auth/login-code";

	/**
	 * The form of a login verifier: 43 to 128 characters, the letters {@code A} to {@code Z} and {@code a} to
	 * {@code z}, the digits, and {@code -}, {@code .}, {@code _} and {@code ~}.
	 */
	static final String LOGIN_VERIFIER_FORM = "[A-Za-z0-9._~-]{43,128}";

	private static final Log log = LogFactory.getLog(LoginCodeController.class);

	private final SessionService sessions;

	LoginCodeController(SessionService sessions) {
		this.sessions = sessions;
	}

	/**
	 * @throws InvalidLoginVerifierException when the login verifier is not the one of the login code;
	 *                                       {@link #invalidLoginVerifier} answers
	 * @throws SessionEndedException         when the session ended, or the login code was used already, or the
	 *                                       OpenCelium user is locked or deleted; {@link #sessionEnded} answers
	 */
	@PostMapping(PATH)
	ResponseEntity<TokenResponse> exchange(Authentication login, @Valid @RequestBody ExchangeRequest request) {
		Jwt loginCode = (Jwt) login.getCredentials();
		return ResponseEntity.ok(TokenResponse.of(sessions.exchange(loginCode, request.loginVerifier())));
	}

	@ExceptionHandler(InvalidLoginVerifierException.class)
	ResponseEntity<ProblemDetail> invalidLoginVerifier() {
		logRefusal(AuthError.INVALID_LOGIN_VERIFIER, "the hash of the login verifier is not the hash of the login code");
		return AuthError.INVALID_LOGIN_VERIFIER.response();
	}

	@ExceptionHandler(SessionEndedException.class)
	ResponseEntity<ProblemDetail> sessionEnded(SessionEndedException ended) {
		logRefusal(AuthError.SESSION_ENDED, ended.getMessage());
		return AuthError.SESSION_ENDED.response();
	}

	/**
	 * A body that is not JSON, also a body of another content type, that lacks the login verifier, or whose login
	 * verifier has another form than {@value #LOGIN_VERIFIER_FORM}. The log line names no value of the body: the
	 * default handler of Spring logs these errors with the refused value, and the value is a login verifier.
	 */
	@ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
			HttpMediaTypeNotSupportedException.class})
	ResponseEntity<ProblemDetail> refuseTheBody() {
		logRefusal(AuthError.BAD_EXCHANGE, "the body is not valid");
		return AuthError.BAD_EXCHANGE.response();
	}

	private static void logRefusal(AuthError error, String reason) {
		log.info("An exchange of a login code failed with the code " + error.code() + ": " + reason + ".");
	}

	/**
	 * @param loginVerifier the login verifier of the HTTP client that started the login, of the form
	 *                      {@value LoginCodeController#LOGIN_VERIFIER_FORM}: a shorter or simpler value could be
	 *                      guessed from the hash in the login code, and a character outside ASCII would hash as another
	 *                      character. {@link #toString()} does not show it.
	 */
	record ExchangeRequest(@NotNull @Pattern(regexp = LOGIN_VERIFIER_FORM) String loginVerifier) {

		@Override
		public String toString() {
			return "ExchangeRequest[loginVerifier=****]";
		}

	}

}
