package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import io.opencelium.common.tenant.TenantId;

/**
 * Issues the login code of a redirect login, a signed token of the third type besides the session JWT and the refresh
 * token. The browser gets it in the URL after the redirect of the login, and the HTTP client exchanges it for the 2
 * tokens of the session. It names the OpenCelium user, the tenant and the session, has a code ID of its own, and holds
 * the hash of the login verifier of the HTTP client that started the login. It holds no token and no code of the IdP.
 * It expires after 1 minute.
 */
final class LoginCodes {

	/** The header {@code typ} of a login code: no other token type has it, so no other decoder accepts a login code. */
	static final String LOGIN_CODE_TYPE = "oc-login-code+jwt";

	/** The claim with the SHA-256 hash of the login verifier, in the base64url form. */
	static final String LOGIN_VERIFIER_HASH_CLAIM = "lvh";

	/** The time from the issue of a login code to its expiry; a fixed value of the code. */
	static final Duration LIFETIME = Duration.ofMinutes(1);

	private final JwtEncoder encoder;

	private final Clock clock;

	/**
	 * @param encoder the encoder of the login code type; it signs the token
	 * @param clock   the clock of core
	 */
	LoginCodes(JwtEncoder encoder, Clock clock) {
		this.encoder = encoder;
		this.clock = clock;
	}

	/**
	 * @param userId            the ID of the OpenCelium user of the session
	 * @param tenantId          the tenant of the session
	 * @param sessionId         the ID of the session that the login code opens
	 * @param codeId            the ID of the login code: the session record keeps it until the exchange
	 * @param loginVerifierHash the SHA-256 hash of the login verifier that the HTTP client gave at the start
	 * @return the signed login code
	 */
	Jwt issue(String userId, TenantId tenantId, String sessionId, String codeId, String loginVerifierHash) {
		Instant now = clock.instant().truncatedTo(ChronoUnit.SECONDS);
		JwtClaimsSet claims = JwtClaimsSet.builder()
			.issuer(SessionTokens.ISSUER)
			.subject(userId)
			.claim(SessionTokens.TENANT_ID_CLAIM, tenantId.value())
			.claim(SessionTokens.SESSION_ID_CLAIM, sessionId)
			.id(codeId)
			.claim(LOGIN_VERIFIER_HASH_CLAIM, loginVerifierHash)
			.issuedAt(now)
			.expiresAt(now.plus(LIFETIME))
			.build();
		return encoder.encode(JwtEncoderParameters.from(claims));
	}

}
