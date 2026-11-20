package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;

import io.opencelium.common.tenant.TenantId;

/**
 * Issues the session JWT of a session, and reads the principal from a valid one. The session JWT names the OpenCelium
 * user, the tenant and the session, and carries the roles. It expires 15 minutes after core issues it, but never after
 * the end of its session. The times are whole seconds, as the token holds them.
 */
final class SessionTokens {

	/** The claim {@code iss} of each token of core. */
	static final String ISSUER = "opencelium";

	/** The header {@code typ} of a session JWT. */
	static final String SESSION_JWT_TYPE = "oc-session+jwt";

	static final Duration SESSION_JWT_LIFETIME = Duration.ofMinutes(15);

	static final String TENANT_ID_CLAIM = "tid";

	static final String SESSION_ID_CLAIM = "sid";

	static final String ROLES_CLAIM = "roles";

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
		Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
		Instant expiresAt = now.plus(SESSION_JWT_LIFETIME);
		if (sessionEnd.isBefore(expiresAt)) {
			expiresAt = sessionEnd.truncatedTo(ChronoUnit.SECONDS);
		}
		JwtClaimsSet claims = JwtClaimsSet.builder().issuer(ISSUER).subject(principal.userId())
				.claim(TENANT_ID_CLAIM, principal.tenantId().value()).claim(SESSION_ID_CLAIM, principal.sessionId())
				.claim(ROLES_CLAIM, List.copyOf(new TreeSet<>(principal.roles()))).issuedAt(now).expiresAt(expiresAt)
				.build();
		return sessionJwtEncoder.encode(JwtEncoderParameters.from(claims));
	}

	/**
	 * The login of a request with a valid session JWT: its principal is the {@link UserPrincipal} of the token.
	 *
	 * @throws InvalidBearerTokenException when the token lacks a claim of a session JWT, so the request gets the
	 *                                     status code 401
	 */
	static UsernamePasswordAuthenticationToken authenticationOf(Jwt sessionJwt) {
		String userId = sessionJwt.getSubject();
		String tenantId = sessionJwt.getClaimAsString(TENANT_ID_CLAIM);
		String sessionId = sessionJwt.getClaimAsString(SESSION_ID_CLAIM);
		List<String> roles = sessionJwt.getClaimAsStringList(ROLES_CLAIM);
		if (userId == null || tenantId == null || sessionId == null || roles == null) {
			throw new InvalidBearerTokenException("The session JWT lacks a claim.");
		}
		UserPrincipal principal;
		try {
			principal = new UserPrincipal(userId, TenantId.of(tenantId), sessionId, Set.copyOf(roles));
		}
		catch (IllegalArgumentException ex) {
			throw new InvalidBearerTokenException("The session JWT names no valid tenant.", ex);
		}
		return UsernamePasswordAuthenticationToken.authenticated(principal, null, List.of());
	}

}
