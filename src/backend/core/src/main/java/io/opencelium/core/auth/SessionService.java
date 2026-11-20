package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserService;

/**
 * Starts, refreshes and ends the sessions of the OpenCelium users of the current tenant. A session record holds the
 * state of each session: its user, its end, and the token ID of its current refresh token.
 * <ul>
 * <li>A login starts a new session with a new random ID. It ends 24 hours after its start. Each login starts a new
 * session, also for a user with a session already.</li>
 * <li>A refresh gives 2 new tokens, and the old refresh token stops. The new session JWT carries the roles that the
 * user has now. The refresh ends the session instead when the refresh token is an old one, or when the user is locked
 * or deleted: a second use of a refresh token can mean that another person has a copy of it. A refresh never moves
 * the end of the session.</li>
 * <li>A logout ends the session. Its session JWT stays valid until it expires, because a session JWT is valid without
 * a read of the database.</li>
 * </ul>
 * The service gets each refresh token from the decoder of its type, so the signature, the type and the expiry are
 * correct already.
 */
@Service
final class SessionService {

	static final Duration SESSION_LIFETIME = Duration.ofHours(24);

	private final SessionTokens tokens;

	private final SessionRepository sessions;

	private final UserService users;

	private final Clock clock;

	SessionService(SessionTokens tokens, SessionRepository sessions, UserService users, Clock clock) {
		this.tokens = tokens;
		this.sessions = sessions;
		this.users = users;
		this.clock = clock;
	}

	/** @return the session JWT and the refresh token of the new session */
	IssuedTokens start(LoginUser user) {
		Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
		Instant end = now.plus(SESSION_LIFETIME);
		String sessionId = UUID.randomUUID().toString();
		String tokenId = newTokenId();
		sessions.insert(new SessionRecord(sessionId, user.tenantId().value(), user.userId(), tokenId, now, end));
		return tokens.issue(new UserPrincipal(user.userId(), user.tenantId(), sessionId, user.roles()), tokenId, end);
	}

	/**
	 * Gives 2 new tokens for the session of a valid refresh token, and the old refresh token stops.
	 *
	 * @param refreshToken a refresh token that the decoder of its type accepted
	 * @throws SessionEndedException when the session does not exist or reached its end, when the refresh token is an
	 *                               old one, or when the OpenCelium user is locked or deleted
	 */
	IssuedTokens refresh(Jwt refreshToken) {
		String sessionId = refreshToken.getClaimAsString(SessionTokens.SESSION_ID_CLAIM);
		String tokenId = refreshToken.getId();
		SessionRecord session = sessions.findById(sessionId)
				.orElseThrow(() -> new SessionEndedException("the session does not exist"));
		// MongoDB removes a record after its end only approximately each 60 seconds.
		if (!clock.instant().isBefore(session.endsAt())) {
			throw new SessionEndedException("the session reached its end");
		}
		if (!session.tokenId().equals(tokenId)) {
			throw endSession(session, "an old refresh token came again");
		}
		UserDocument user = users.findById(session.userId()).filter(found -> !found.locked())
				.orElseThrow(() -> endSession(session, "the OpenCelium user is locked or deleted"));
		String newTokenId = newTokenId();
		if (!sessions.replaceTokenId(sessionId, tokenId, newTokenId)) {
			throw endSession(session, "another refresh used the refresh token first");
		}
		var principal = new UserPrincipal(session.userId(), TenantId.of(session.tenantId()), sessionId, user.roles());
		return tokens.issue(principal, newTokenId, session.endsAt());
	}

	/**
	 * Ends the session of a valid refresh token. Its session JWT stays valid until it expires. A session that ended
	 * already is no error.
	 *
	 * @param refreshToken a refresh token that the decoder of its type accepted
	 */
	void end(Jwt refreshToken) {
		sessions.delete(refreshToken.getClaimAsString(SessionTokens.SESSION_ID_CLAIM));
	}

	/**
	 * Deletes the session record. The reason names the session and its user: they are not secrets, and an operator
	 * needs them to find the user of a refresh token that another person can have a copy of.
	 */
	private SessionEndedException endSession(SessionRecord session, String reason) {
		sessions.delete(session.id());
		return new SessionEndedException(
				reason + " (session " + session.id() + ", OpenCelium user " + session.userId() + ")");
	}

	private static String newTokenId() {
		return UUID.randomUUID().toString();
	}

}
