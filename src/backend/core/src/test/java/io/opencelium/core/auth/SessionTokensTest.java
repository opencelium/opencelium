package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;

import io.opencelium.common.tenant.TenantId;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The session JWT names the OpenCelium user, the tenant and the session, and it ends no later than its session. The
 * encoder of the test gives the claims back without a signature: the signature is the work of the token signature.
 */
class SessionTokensTest {

	private static final Instant NOW = Instant.parse("2026-11-20T10:00:00Z");

	private static final UserPrincipal ADMIN = new UserPrincipal("user-1", TenantId.SELF_HOST, "session-1",
			Set.of("ADMIN"));

	private final JwtEncoder unsigned = parameters -> Jwt.withTokenValue("unsigned").header("alg", "none")
			.claims(claims -> claims.putAll(parameters.getClaims().getClaims())).build();

	private final SessionTokens tokens = new SessionTokens(unsigned, unsigned, Clock.fixed(NOW, ZoneOffset.UTC));

	@Test
	void issueSessionJwtNamesTheUserTheTenantAndTheSessionWhenAUserLogsIn() {
		Jwt sessionJwt = tokens.issueSessionJwt(ADMIN, NOW.plus(Duration.ofHours(24)));

		assertThat(sessionJwt.getClaimAsString("iss")).isEqualTo("opencelium");
		assertThat(sessionJwt.getSubject()).isEqualTo("user-1");
		assertThat(sessionJwt.getClaimAsString("tid")).isEqualTo("self-host-tenant");
		assertThat(sessionJwt.getClaimAsString("sid")).isEqualTo("session-1");
		assertThat(sessionJwt.getClaimAsStringList("roles")).containsExactly("ADMIN");
		assertThat(sessionJwt.getIssuedAt()).isEqualTo(NOW);
		assertThat(sessionJwt.getExpiresAt()).isEqualTo(NOW.plus(Duration.ofMinutes(15)));
	}

	@Test
	void authenticationOfGivesEachRoleAsAnAuthorityWhenTheSessionJwtHasRoles() {
		var editorAndAdmin = new UserPrincipal("user-2", TenantId.SELF_HOST, "session-2", Set.of("EDITOR", "ADMIN"));
		Jwt sessionJwt = tokens.issueSessionJwt(editorAndAdmin, NOW.plus(Duration.ofHours(24)));

		assertThat(SessionTokens.authenticationOf(sessionJwt).getAuthorities()).extracting(GrantedAuthority::getAuthority)
				.containsExactlyInAnyOrder("ROLE_ADMIN", "ROLE_EDITOR");
	}

	@Test
	void issueSessionJwtExpiresNoLaterThanTheEndOfTheSessionWhenTheEndIsNear() {
		Instant sessionEnd = NOW.plus(Duration.ofMinutes(5));

		assertThat(tokens.issueSessionJwt(ADMIN, sessionEnd).getExpiresAt()).isEqualTo(sessionEnd);
	}

}
