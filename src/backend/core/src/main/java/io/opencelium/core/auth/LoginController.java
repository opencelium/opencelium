package io.opencelium.core.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.ProviderNotFoundException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * The login of an OpenCelium user with a name and a password; the name is a username or an email. The login strategies
 * of the deployment mode compare them; a correct pair starts a session, and the response holds its session JWT and its
 * refresh token. A refused login gets an error response with a code ({@link AuthError}):
 * <ul>
 * <li>A wrong name and a wrong password get the same response, so that it does not show which names exist.</li>
 * <li>A locked user gets a response of its own only with the correct password.</li>
 * <li>A body that is not JSON, without a name or a password, or with a field longer than {@value #MAX_LENGTH}
 * characters gets the response of a bad request.</li>
 * </ul>
 * Each refused login writes 1 line to the log with the code and the reason, never with the name or the password: a
 * person can type a password into the field of the name. A login that cannot read the user is not refused: it stops
 * with an error, so that the person does not read "wrong password" and the operator sees the problem.
 */
@RestController
final class LoginController {

	static final String PATH = "/api/auth";

	/** The longest name and the longest password that a login takes: a bound for the query and for the hash. */
	static final int MAX_LENGTH = 256;

	private static final Log log = LogFactory.getLog(LoginController.class);

	private final AuthenticationManager loginStrategies;

	private final SessionService sessions;

	LoginController(LoginStrategies loginStrategies, SessionService sessions) {
		this.loginStrategies = loginStrategies.authenticationManager();
		this.sessions = sessions;
	}

	/**
	 * @throws AuthenticationException when the login strategies refuse the name and the password; {@link #refuse}
	 *                                 gives the response
	 * @throws IllegalStateException   when the login strategy cannot read the user, for example because the database
	 *                                 does not answer
	 */
	@PostMapping(PATH)
	ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
		Authentication login;
		try {
			login = loginStrategies.authenticate(
					UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
		}
		catch (InternalAuthenticationServiceException ex) {
			// The cause of the wrapper, not the wrapper: Spring Security answers each AuthenticationException in the
			// cause chain with the status code 401 again.
			throw new IllegalStateException("A login stopped: the OpenCelium user of the name cannot be read.",
					ex.getCause());
		}
		return ResponseEntity.ok(TokenResponse.of(sessions.start((LoginUser) login.getPrincipal())));
	}

	/** A login that the login strategies refused: the response of a locked user, or of a wrong name or password. */
	@ExceptionHandler(AuthenticationException.class)
	ResponseEntity<ProblemDetail> refuse(AuthenticationException refusal) {
		AuthError error = refusal instanceof LockedException ? AuthError.USER_LOCKED : AuthError.INVALID_CREDENTIALS;
		logRefusal(error, reasonOf(refusal));
		return error.response();
	}

	/**
	 * A login body that is not JSON, also a body of another content type such as a form, that lacks the name or the
	 * password, or that has a field longer than {@value #MAX_LENGTH} characters. The log line names no value of the
	 * body. The default handler of Spring logs these errors with the refused value, and the value can be a password.
	 */
	@ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class,
			HttpMediaTypeNotSupportedException.class})
	ResponseEntity<ProblemDetail> refuseTheBody() {
		logRefusal(AuthError.BAD_REQUEST, "the body is not valid");
		return AuthError.BAD_REQUEST.response();
	}

	/**
	 * A fixed text for each type of refusal, and not the message of the exception: a login strategy can put the name
	 * into its message. The password provider gives 1 type for a wrong name and for a wrong password.
	 */
	private static String reasonOf(AuthenticationException refusal) {
		return switch (refusal) {
			case LockedException _ -> "the OpenCelium user is locked";
			case BadCredentialsException _ -> "no OpenCelium user has the name, or the password is not correct";
			case ProviderNotFoundException _ -> "the deployment mode has no login strategy for a password";
			default -> "a login strategy refused it";
		};
	}

	private static void logRefusal(AuthError error, String reason) {
		log.info("A login failed with the code " + error.code() + ": " + reason + ".");
	}

	/**
	 * @param username a username or an email of a user of the current tenant
	 * @param password the password; {@link #toString()} shows neither value, because a person can type a password into
	 *                 the field of the name
	 */
	record LoginRequest(@NotNull @Size(max = MAX_LENGTH) String username,
			@NotNull @Size(max = MAX_LENGTH) String password) {

		@Override
		public String toString() {
			return "LoginRequest[username=****, password=****]";
		}

	}

}
