package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Instant;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;

/**
 * Issues the session JWT of a session. The session JWT names the OpenCelium user, the tenant and the session, and
 * carries the roles. It expires 15 minutes after core issues it, but never after the end of its session.
 */
final class SessionTokens {

	private final JwtEncoder sessionJwtEncoder;

	private final Clock clock;

	/**
	 * @param sessionJwtEncoder the encoder of the session JWT type; it signs the token
	 * @param clock             the clock of core
	 */
	SessionTokens(JwtEncoder sessionJwtEncoder, Clock clock) {
		this.sessionJwtEncoder = sessionJwtEncoder;
		this.clock = clock;
	}

	/**
	 * @param principal  the OpenCelium user and the session
	 * @param sessionEnd the end of the session; the session JWT does not expire after it
	 * @return the signed session JWT, with its claims and its expiry
	 */
	Jwt issueSessionJwt(UserPrincipal principal, Instant sessionEnd) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}
