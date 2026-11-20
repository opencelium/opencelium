package io.opencelium.core.auth;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The refresh and the end of a session. The 2 endpoints take the refresh token of the session as the bearer token
 * and need no session JWT: the refresh chain authenticates the refresh token, and its login holds the token. A
 * refresh that the session service refuses gets the error response {@code session-ended}, and 1 line in the log with
 * the reason, never with a token. The response never shows the reason.
 */
@RestController
final class SessionController {

	static final String REFRESH_PATH = "/api/auth/refresh";

	static final String LOGOUT_PATH = "/api/auth/logout";

	private static final Log log = LogFactory.getLog(SessionController.class);

	private final SessionService sessions;

	SessionController(SessionService sessions) {
		this.sessions = sessions;
	}

	/** @throws SessionEndedException when the session does not exist any more; {@link #sessionEnded} answers */
	@PostMapping(REFRESH_PATH)
	ResponseEntity<TokenResponse> refresh(Authentication login) {
		return ResponseEntity.ok(TokenResponse.of(sessions.refresh(refreshTokenOf(login))));
	}

	/** The response has the status code 204 and no body, also for a session that ended already. */
	@PostMapping(LOGOUT_PATH)
	ResponseEntity<Void> logOut(Authentication login) {
		sessions.end(refreshTokenOf(login));
		return ResponseEntity.noContent().build();
	}

	@ExceptionHandler(SessionEndedException.class)
	ResponseEntity<ProblemDetail> sessionEnded(SessionEndedException ended) {
		log.info("A refresh failed with the code " + AuthError.SESSION_ENDED.code() + ": " + ended.getMessage() + ".");
		return AuthError.SESSION_ENDED.response();
	}

	private static Jwt refreshTokenOf(Authentication login) {
		return (Jwt) login.getCredentials();
	}

}
