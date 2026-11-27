package io.opencelium.core.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;

import io.opencelium.common.tenant.TenantId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The session JWT names the OpenCelium user, the tenant and the session, and it ends no later than its session. The
 * login of an exchange takes the OpenCelium user, the tenant and the session from the login code, and it refuses a
 * login code without its code ID or without the hash of its login verifier: without them the login code has no single
 * use and no bond to the HTTP client that started the login. The encoder of the test gives the claims back without a
 * signature: the signature is the work of the token signature.
 */
class SessionTokensTest {

	private static final Instant NOW = Instant.parse("2026-11-20T10:00:00Z");

	private static final UserPrincipal ADMIN = new UserPrincipal("user-1", TenantId.SELF_HOST, "session-1",
			Set.of("ADMIN"));

	private final JwtEncoder unsigned = parameters -> Jwt.withTokenValue("unsigned").header("alg", "none")
			.claims(claims -> claims.putAll(parameters.getClaims().getClaims())).build();

	private final SessionTokens tokens = new SessionTokens(unsigned, unsigned, Clock.fixed(NOW, ZoneOffset.UTC));

	private final LoginCodes loginCodes = new LoginCodes(unsigned, Clock.fixed(NOW, ZoneOffset.UTC));

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

	@Test
	void authenticationOfLoginCodeGivesTheUserTheTenantAndTheSessionWithoutRolesWhenTheLoginCodeIsComplete() {
		Jwt loginCode = aLoginCode();

		UsernamePasswordAuthenticationToken login = SessionTokens.authenticationOfLoginCode(loginCode);

		assertThat(login.isAuthenticated()).isTrue();
		assertThat(login.getPrincipal()).as("the principal")
			.isEqualTo(new UserPrincipal("user-3", TenantId.SELF_HOST, "session-3", Set.of()));
		assertThat(login.getAuthorities()).as("the authorities").isEmpty();
		assertThat(login.getCredentials()).as("the credentials").isEqualTo(loginCode);
	}

	@Test
	void authenticationOfLoginCodeThrowsInvalidBearerTokenExceptionWhenTheLoginCodeHasNoCodeId() {
		Jwt withoutCodeId = without(aLoginCode(), JwtClaimNames.JTI);

		assertThatExceptionOfType(InvalidBearerTokenException.class)
			.isThrownBy(() -> SessionTokens.authenticationOfLoginCode(withoutCodeId));
	}

	@Test
	void authenticationOfLoginCodeThrowsInvalidBearerTokenExceptionWhenTheLoginCodeHasNoLoginVerifierHash() {
		Jwt withoutHash = without(aLoginCode(), LoginCodes.LOGIN_VERIFIER_HASH_CLAIM);

		assertThatExceptionOfType(InvalidBearerTokenException.class)
			.isThrownBy(() -> SessionTokens.authenticationOfLoginCode(withoutHash));
	}

	/** A complete login code of the OpenCelium user {@code user-3} in the session {@code session-3}. */
	private Jwt aLoginCode() {
		return loginCodes.issue("user-3", TenantId.SELF_HOST, "session-3", "code-3", "hash-of-a-login-verifier");
	}

	/** The token with each claim except the one; the header and the value stay. */
	private static Jwt without(Jwt token, String claim) {
		return Jwt.withTokenValue(token.getTokenValue()).headers(headers -> headers.putAll(token.getHeaders()))
			.claims(claims -> {
				claims.putAll(token.getClaims());
				claims.remove(claim);
			})
			.build();
	}

}
