package io.opencelium.core.testsupport.fixture;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.secrets.keys.TokenSignature;

/**
 * A session JWT for a user that no login can make, for example a user of a tenant in the cloud mode, where core has no
 * login strategy of its own. The token signature of the context signs it, so core accepts it as its own token. The
 * header type and the claims are the token contract of core, written out here so that the fixture does not depend on
 * the code that issues a session JWT.
 */
public final class SessionJwtFixture {

	private static final String SESSION_JWT_TYPE = "oc-session+jwt";

	private static final Duration LIFETIME = Duration.ofMinutes(15);

	private SessionJwtFixture() {
	}

	/**
	 * @param signature the token signature of the Spring context of the test
	 * @param tenant    the tenant of the user
	 * @param roles     the roles of the user
	 * @return a valid session JWT of a new session, issued now
	 */
	public static String sessionJwt(TokenSignature signature, TenantId tenant, Set<String> roles) {
		Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		JwtClaimsSet claims = JwtClaimsSet.builder().issuer("opencelium").subject("user-of-" + tenant.value())
				.claim("tid", tenant.value()).claim("sid", "session-of-" + tenant.value())
				.claim("roles", List.copyOf(new TreeSet<>(roles))).issuedAt(now).expiresAt(now.plus(LIFETIME)).build();
		return signature.encoder(SESSION_JWT_TYPE).encode(JwtEncoderParameters.from(claims)).getTokenValue();
	}

}
