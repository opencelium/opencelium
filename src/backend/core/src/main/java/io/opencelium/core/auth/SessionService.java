package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Duration;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

/**
 * Starts the session of an OpenCelium user after a successful login. A session has a new random ID and ends 24 hours
 * after its start. Each login starts a new session, also for a user with a session already.
 */
@Service
final class SessionService {

	static final Duration SESSION_LIFETIME = Duration.ofHours(24);

	private final SessionTokens tokens;

	private final Clock clock;

	SessionService(SessionTokens tokens, Clock clock) {
		this.tokens = tokens;
		this.clock = clock;
	}

	/** @return the session JWT and the refresh token of the new session */
	IssuedTokens start(LoginUser user) {
		var principal = new UserPrincipal(user.userId(), user.tenantId(), UUID.randomUUID().toString(), user.roles());
		return new IssuedTokens(tokens.issueSessionJwt(principal, clock.instant().plus(SESSION_LIFETIME)), null);
	}

	/**
	 * Gives 2 new tokens for the session of a valid refresh token, and the old refresh token stops.
	 *
	 * @param refreshToken a refresh token that the decoder of its type accepted
	 * @throws SessionEndedException when the session does not exist or reached its end, when the refresh token is an
	 *                               old one, or when the OpenCelium user is locked or deleted
	 */
	IssuedTokens refresh(Jwt refreshToken) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

	/**
	 * Ends the session of a valid refresh token. Its session JWT stays valid until it expires.
	 *
	 * @param refreshToken a refresh token that the decoder of its type accepted
	 */
	void end(Jwt refreshToken) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

}
