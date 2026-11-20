package io.opencelium.core.auth;

import java.nio.file.Path;
import java.text.ParseException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import com.jayway.jsonpath.JsonPath;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.MutableClock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * A login also gives a refresh token. The HTTP client refreshes the session with it and gets 2 new tokens, and it ends
 * the session with a logout; the 2 endpoints take the refresh token as the bearer token. A second use of an old
 * refresh token ends the session. A refresh token is not valid as a session JWT, and a session JWT is not valid for a
 * refresh. The sessions are those of the default admin of the setup.
 * <p>
 * The clock of core starts at the real time: MongoDB removes a session record after its end by the real time, and a
 * record of a clock in the past could disappear during a test.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class RefreshEndpointTest {

	private static final Instant START = Instant.now().truncatedTo(ChronoUnit.SECONDS);

	private static final MutableClock CLOCK = new MutableClock(START);

	private static final Duration SESSION_JWT_LIFETIME = Duration.ofMinutes(15);

	private static final Duration REFRESH_TOKEN_LIFETIME = Duration.ofHours(5);

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, RefreshEndpointTest.class, () -> dataDir);
	}

	@TestBean
	Clock clock;

	static Clock clock() {
		return CLOCK;
	}

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void resetTheClock() {
		CLOCK.set(START);
	}

	@Test
	void loginGivesARefreshTokenWhenTheUserLogsIn() throws ParseException {
		MvcTestResult login = LoginRequests.logInAsTheDefaultAdmin(mvc);

		SignedJWT refreshToken = SignedJWT.parse(LoginRequests.refreshTokenOf(login));
		JWTClaimsSet claims = refreshToken.getJWTClaimsSet();
		JWTClaimsSet sessionJwtClaims = SignedJWT.parse(LoginRequests.sessionJwtOf(login)).getJWTClaimsSet();
		assertThat(refreshToken.getHeader().getType()).isEqualTo(new JOSEObjectType("oc-refresh+jwt"));
		assertThat(claims.getIssuer()).isEqualTo("opencelium");
		assertThat(claims.getSubject()).isEqualTo(sessionJwtClaims.getSubject());
		assertThat(claims.getStringClaim("tid")).isEqualTo("self-host-tenant");
		assertThat(claims.getStringClaim("sid")).isEqualTo(sessionJwtClaims.getStringClaim("sid"));
		assertThat(claims.getJWTID()).isNotBlank();
		assertThat(claims.getIssueTime().toInstant()).isEqualTo(START);
		assertThat(claims.getExpirationTime().toInstant()).isEqualTo(START.plus(REFRESH_TOKEN_LIFETIME));
		assertThat(instantOf(login, "$.refreshTokenExpiresAt")).isEqualTo(START.plus(REFRESH_TOKEN_LIFETIME));
	}

	@Test
	void refreshGivesTwoNewTokensWhenTheRefreshTokenIsValid() {
		MvcTestResult login = LoginRequests.logInAsTheDefaultAdmin(mvc);
		Instant later = START.plus(Duration.ofMinutes(10));
		CLOCK.set(later);

		MvcTestResult refresh = LoginRequests.refresh(mvc, LoginRequests.refreshTokenOf(login));

		assertThat(refresh).hasStatusOk();
		String sessionJwt = LoginRequests.sessionJwtOf(refresh);
		String refreshToken = LoginRequests.refreshTokenOf(refresh);
		assertThat(sessionJwt).isNotEqualTo(LoginRequests.sessionJwtOf(login));
		assertThat(refreshToken).isNotEqualTo(LoginRequests.refreshTokenOf(login));
		assertThat(sessionIdOf(sessionJwt)).isEqualTo(sessionIdOf(LoginRequests.sessionJwtOf(login)));
		assertThat(instantOf(refresh, "$.sessionJwtExpiresAt")).isEqualTo(later.plus(SESSION_JWT_LIFETIME));
		assertThat(instantOf(refresh, "$.refreshTokenExpiresAt")).isEqualTo(later.plus(REFRESH_TOKEN_LIFETIME));
		assertThat(LoginRequests.me(mvc, sessionJwt)).as("the new session JWT on the current user").hasStatusOk();
	}

	@Test
	void refreshGivesSessionEndedWhenTheOldRefreshTokenComesAgain() {
		String oldRefreshToken = LoginRequests.refreshTokenOf(LoginRequests.logInAsTheDefaultAdmin(mvc));
		MvcTestResult first = LoginRequests.refresh(mvc, oldRefreshToken);
		assertThat(first).as("the first refresh").hasStatusOk();
		String newRefreshToken = LoginRequests.refreshTokenOf(first);

		MvcTestResult again = LoginRequests.refresh(mvc, oldRefreshToken);

		LoginRequests.assertProblem(again, HttpStatus.UNAUTHORIZED, "session-ended");
		LoginRequests.assertProblem(LoginRequests.refresh(mvc, newRefreshToken), HttpStatus.UNAUTHORIZED,
				"session-ended");
	}

	@Test
	void refreshGivesStatus401WhenTheTokenIsASessionJwt() {
		MvcTestResult login = LoginRequests.logInAsTheDefaultAdmin(mvc);

		MvcTestResult refresh = LoginRequests.refresh(mvc, LoginRequests.sessionJwtOf(login));

		assertThat(refresh).hasStatus(HttpStatus.UNAUTHORIZED).headers().hasHeaderSatisfying(
				HttpHeaders.WWW_AUTHENTICATE, values -> assertThat(values).singleElement().asString().startsWith("Bearer"));
		assertThat(refresh).bodyText().isEmpty();
		assertThat(LoginRequests.refresh(mvc, LoginRequests.refreshTokenOf(login)))
				.as("a refresh with the refresh token of the session").hasStatusOk();
	}

	@Test
	void meGivesStatus401WhenTheTokenIsARefreshToken() {
		MvcTestResult login = LoginRequests.logInAsTheDefaultAdmin(mvc);

		MvcTestResult me = LoginRequests.me(mvc, LoginRequests.refreshTokenOf(login));

		assertThat(me).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(me).bodyText().isEmpty();
		assertThat(LoginRequests.me(mvc, LoginRequests.sessionJwtOf(login)))
				.as("the current user with the session JWT of the session").hasStatusOk();
	}

	@Test
	void logoutGivesStatus204WhenTheRefreshTokenIsValid() {
		MvcTestResult login = LoginRequests.logInAsTheDefaultAdmin(mvc);
		String sessionId = sessionIdOf(LoginRequests.sessionJwtOf(login));
		String refreshToken = LoginRequests.refreshTokenOf(login);
		assertThat(sessionRecordCount(sessionId)).as("the session records before the logout").isEqualTo(1);

		MvcTestResult logout = LoginRequests.logOut(mvc, refreshToken);

		assertThat(logout).hasStatus(HttpStatus.NO_CONTENT);
		assertThat(logout).bodyText().isEmpty();
		assertThat(sessionRecordCount(sessionId)).as("the session records after the logout").isZero();
	}

	@Test
	void refreshGivesSessionEndedWhenTheUserLoggedOut() {
		String refreshToken = LoginRequests.refreshTokenOf(LoginRequests.logInAsTheDefaultAdmin(mvc));
		assertThat(LoginRequests.logOut(mvc, refreshToken)).as("the logout").hasStatus(HttpStatus.NO_CONTENT);

		MvcTestResult refresh = LoginRequests.refresh(mvc, refreshToken);

		LoginRequests.assertProblem(refresh, HttpStatus.UNAUTHORIZED, "session-ended");
	}

	@Test
	void meAcceptsTheSessionJwtAfterTheLogoutUntilItExpires() {
		MvcTestResult login = LoginRequests.logInAsTheDefaultAdmin(mvc);
		String sessionJwt = LoginRequests.sessionJwtOf(login);
		assertThat(LoginRequests.logOut(mvc, LoginRequests.refreshTokenOf(login))).as("the logout")
				.hasStatus(HttpStatus.NO_CONTENT);

		assertThat(LoginRequests.me(mvc, sessionJwt)).as("the session JWT after the logout").hasStatusOk();

		CLOCK.set(START.plus(SESSION_JWT_LIFETIME).plusSeconds(1));
		assertThat(LoginRequests.me(mvc, sessionJwt)).as("the session JWT after its expiry")
				.hasStatus(HttpStatus.UNAUTHORIZED);
	}

	private static String sessionIdOf(String token) {
		try {
			return SignedJWT.parse(token).getJWTClaimsSet().getStringClaim("sid");
		}
		catch (ParseException ex) {
			throw new IllegalArgumentException("The token is not a JWT.", ex);
		}
	}

	private static Instant instantOf(MvcTestResult response, String path) {
		return Instant.parse(JsonPath.read(LoginRequests.bodyOf(response), path));
	}

	private long sessionRecordCount(String sessionId) {
		return mongo.count(query(where("_id").is(sessionId)), SessionRecord.class);
	}

}
