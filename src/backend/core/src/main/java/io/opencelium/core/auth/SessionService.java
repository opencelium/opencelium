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

	/** @return the session JWT of the new session */
	Jwt start(LoginUser user) {
		var principal = new UserPrincipal(user.userId(), user.tenantId(), UUID.randomUUID().toString(), user.roles());
		return tokens.issueSessionJwt(principal, clock.instant().plus(SESSION_LIFETIME));
	}

}
