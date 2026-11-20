package io.opencelium.core.auth;

import java.time.Instant;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * The login of an OpenCelium user with a name and a password. The login strategies of the deployment mode compare
 * them; a correct pair starts a session, and the response holds its session JWT. Each refused login gets the same
 * status code 401, whatever the reason. A login that cannot read the user is not refused: it stops with an error, so
 * that the person does not read "wrong password" and the operator sees the problem. A body that is not JSON, or with a
 * field longer than {@value #MAX_LENGTH} characters, gets the status code 400.
 */
@RestController
final class LoginController {

	static final String PATH = "/api/auth/login";

	/** The longest name and the longest password that a login takes: a bound for the query and for the hash. */
	static final int MAX_LENGTH = 256;

	private final AuthenticationManager loginStrategies;

	private final SessionService sessions;

	LoginController(LoginStrategies loginStrategies, SessionService sessions) {
		this.loginStrategies = loginStrategies.authenticationManager();
		this.sessions = sessions;
	}

	/**
	 * @throws IllegalStateException when the login strategy cannot read the user, for example because the database
	 *                               does not answer
	 */
	@PostMapping(PATH)
	ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
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
		catch (AuthenticationException ex) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		Jwt sessionJwt = sessions.start((LoginUser) login.getPrincipal());
		return ResponseEntity.ok(new LoginResponse(sessionJwt.getTokenValue(), sessionJwt.getExpiresAt()));
	}

	/**
	 * A login body that is not JSON, or that has a field longer than {@value #MAX_LENGTH} characters: the status code
	 * 400 and no body. This handler writes no log line. The default handler of Spring logs these errors with the
	 * refused value, and the value can be a password.
	 */
	@ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
	ResponseEntity<Void> refuseTheBody() {
		return ResponseEntity.badRequest().build();
	}

	/**
	 * @param username a username of the current tenant
	 * @param password the password; {@link #toString()} shows neither value, because a person can type a password into
	 *                 the field of the name
	 */
	record LoginRequest(@Size(max = MAX_LENGTH) String username, @Size(max = MAX_LENGTH) String password) {

		@Override
		public String toString() {
			return "LoginRequest[username=****, password=****]";
		}

	}

	/** @param sessionJwtExpiresAt the claim {@code exp} of the session JWT, in UTC */
	record LoginResponse(String sessionJwt, Instant sessionJwtExpiresAt) {

		/** Without the token. */
		@Override
		public String toString() {
			return "LoginResponse[sessionJwt=****, sessionJwtExpiresAt=" + sessionJwtExpiresAt + "]";
		}

	}

}
