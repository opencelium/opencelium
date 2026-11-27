package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.authz.Roles;

/**
 * Issues the 2 tokens of a session, and reads the principal from a valid one. Both tokens name the OpenCelium user,
 * the tenant and the session:
 * <ul>
 * <li>The session JWT also carries the roles. It expires 15 minutes after core issues it.</li>
 * <li>The refresh token also carries its own token ID, so that the session service knows the current refresh token
 * of a session. It has no roles. It expires 5 hours after core issues it.</li>
 * </ul>
 * No token expires after the end of its session. The times are whole seconds, as a token holds them.
 */
final class SessionTokens {

	/** The claim {@code iss} of each token of core. */
	static final String ISSUER = "opencelium";

	/** The header {@code typ} of a session JWT. */
	static final String SESSION_JWT_TYPE = "oc-session+jwt";

	/** The header {@code typ} of a refresh token. */
	static final String REFRESH_TOKEN_TYPE = "oc-refresh+jwt";

	static final Duration SESSION_JWT_LIFETIME = Duration.ofMinutes(15);

	static final Duration REFRESH_TOKEN_LIFETIME = Duration.ofHours(5);

	static final String TENANT_ID_CLAIM = "tid";

	static final String SESSION_ID_CLAIM = "sid";

	static final String ROLES_CLAIM = "roles";

	private final JwtEncoder sessionJwtEncoder;

	private final JwtEncoder refreshTokenEncoder;

	private final Clock clock;

	/**
	 * @param sessionJwtEncoder   the encoder of the session JWT type; it signs the token
	 * @param refreshTokenEncoder the encoder of the refresh token type; it signs the token
	 * @param clock               the clock of core
	 */
	SessionTokens(JwtEncoder sessionJwtEncoder, JwtEncoder refreshTokenEncoder, Clock clock) {
		this.sessionJwtEncoder = sessionJwtEncoder;
		this.refreshTokenEncoder = refreshTokenEncoder;
		this.clock = clock;
	}

	/**
	 * @param principal  the OpenCelium user, with the roles, and the session
	 * @param tokenId    the token ID of the new refresh token
	 * @param sessionEnd the end of the session; no token expires after it
	 * @return a new session JWT and a new refresh token of the session
	 */
	IssuedTokens issue(UserPrincipal principal, String tokenId, Instant sessionEnd) {
		return new IssuedTokens(issueSessionJwt(principal, sessionEnd),
				issueRefreshToken(principal, tokenId, sessionEnd));
	}

	/**
	 * @param principal  the OpenCelium user and the session
	 * @param sessionEnd the end of the session; the session JWT does not expire after it
	 * @return the signed session JWT, with its claims and its expiry
	 */
	Jwt issueSessionJwt(UserPrincipal principal, Instant sessionEnd) {
		Instant now = now();
		JwtClaimsSet claims = claimsOf(principal, now, expiry(now, SESSION_JWT_LIFETIME, sessionEnd))
				.claim(ROLES_CLAIM, List.copyOf(new TreeSet<>(principal.roles()))).build();
		return sessionJwtEncoder.encode(JwtEncoderParameters.from(claims));
	}

	private Jwt issueRefreshToken(UserPrincipal principal, String tokenId, Instant sessionEnd) {
		Instant now = now();
		JwtClaimsSet claims = claimsOf(principal, now, expiry(now, REFRESH_TOKEN_LIFETIME, sessionEnd)).id(tokenId)
				.build();
		return refreshTokenEncoder.encode(JwtEncoderParameters.from(claims));
	}

	/**
	 * The login of a request with a valid session JWT: its principal is the {@link UserPrincipal} of the token, and
	 * each role of the token is its authority of {@link Roles}. The permission rules of the access control read these
	 * authorities.
	 *
	 * @throws InvalidBearerTokenException when the token lacks a claim of a session JWT, so the request gets the
	 *                                     status code 401
	 */
	static UsernamePasswordAuthenticationToken authenticationOf(Jwt sessionJwt) {
		List<String> roles = sessionJwt.getClaimAsStringList(ROLES_CLAIM);
		if (roles == null) {
			throw new InvalidBearerTokenException("The session JWT lacks a claim.");
		}
		return UsernamePasswordAuthenticationToken.authenticated(principalOf(sessionJwt, Set.copyOf(roles)), null,
				authoritiesOf(roles));
	}

	private static List<GrantedAuthority> authoritiesOf(List<String> roles) {
		return new TreeSet<>(roles).stream()
			.<GrantedAuthority>map(role -> new SimpleGrantedAuthority(Roles.authorityOf(role)))
			.toList();
	}

	/**
	 * The login of a request with a valid refresh token: its principal is the {@link UserPrincipal} of the token,
	 * without roles, and its credentials are the token itself, which the session service reads.
	 *
	 * @throws InvalidBearerTokenException when the token lacks a claim of a refresh token, so the request gets the
	 *                                     status code 401
	 */
	static UsernamePasswordAuthenticationToken authenticationOfRefreshToken(Jwt refreshToken) {
		if (refreshToken.getId() == null) {
			throw new InvalidBearerTokenException("The refresh token lacks a claim.");
		}
		return UsernamePasswordAuthenticationToken.authenticated(principalOf(refreshToken, Set.of()), refreshToken,
				List.of());
	}

	/**
	 * The login of an exchange with a valid login code: its principal is the {@link UserPrincipal} of the login code,
	 * without roles, and its credentials are the login code itself, whose code ID and hash of the login verifier the
	 * session service reads.
	 *
	 * @throws InvalidBearerTokenException when the login code lacks a claim of a login code, so the request gets the
	 *                                     status code 401
	 */
	static UsernamePasswordAuthenticationToken authenticationOfLoginCode(Jwt loginCode) {
		throw new UnsupportedOperationException();
	}

	private static UserPrincipal principalOf(Jwt token, Set<String> roles) {
		String userId = token.getSubject();
		String tenantId = token.getClaimAsString(TENANT_ID_CLAIM);
		String sessionId = token.getClaimAsString(SESSION_ID_CLAIM);
		if (userId == null || tenantId == null || sessionId == null) {
			throw new InvalidBearerTokenException("The token lacks a claim.");
		}
		try {
			return new UserPrincipal(userId, TenantId.of(tenantId), sessionId, roles);
		}
		catch (IllegalArgumentException ex) {
			throw new InvalidBearerTokenException("The token names no valid tenant.", ex);
		}
	}

	private static JwtClaimsSet.Builder claimsOf(UserPrincipal principal, Instant issuedAt, Instant expiresAt) {
		return JwtClaimsSet.builder().issuer(ISSUER).subject(principal.userId())
				.claim(TENANT_ID_CLAIM, principal.tenantId().value()).claim(SESSION_ID_CLAIM, principal.sessionId())
				.issuedAt(issuedAt).expiresAt(expiresAt);
	}

	/** The time of the lifetime after now, but not after the end of the session. */
	private static Instant expiry(Instant now, Duration lifetime, Instant sessionEnd) {
		Instant expiresAt = now.plus(lifetime);
		Instant end = sessionEnd.truncatedTo(ChronoUnit.SECONDS);
		return end.isBefore(expiresAt) ? end : expiresAt;
	}

	private Instant now() {
		return clock.instant().truncatedTo(ChronoUnit.SECONDS);
	}

}
