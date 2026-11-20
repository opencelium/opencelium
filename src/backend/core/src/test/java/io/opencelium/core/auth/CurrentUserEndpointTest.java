package io.opencelium.core.auth;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

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

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.MutableClock;
import io.opencelium.core.testsupport.fixture.TokenFixture;
import io.opencelium.core.user.UserDocument;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * A valid session JWT opens the endpoint of the current OpenCelium user; a request without one gets the status code
 * 401 and no body. The session JWTs come from a login of the default admin of the setup.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class CurrentUserEndpointTest {

	private static final Instant START = Instant.parse("2026-11-20T10:00:00Z");

	private static final MutableClock CLOCK = new MutableClock(START);

	private static final Duration SESSION_JWT_LIFETIME = Duration.ofMinutes(15);

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, CurrentUserEndpointTest.class, () -> dataDir);
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
	void meGivesTheDataOfTheUserWhenTheSessionJwtIsValid() {
		String sessionJwt = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		MvcTestResult me = LoginRequests.me(mvc, sessionJwt);

		assertThat(me).hasStatusOk();
		assertThat(me).bodyJson().extractingPath("$.id").isEqualTo(theDefaultAdmin().id());
		assertThat(me).bodyJson().extractingPath("$.username").isEqualTo(SetupContext.DEFAULT_ADMIN_USERNAME);
		assertThat(me).bodyJson().extractingPath("$.tenantId").isEqualTo("self-host-tenant");
		assertThat(me).bodyJson().extractingPath("$.roles").asArray().containsExactly("ADMIN");
	}

	@Test
	void meHasNoPasswordHashWhenItGivesTheData() {
		MvcTestResult me = LoginRequests.me(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));

		assertThat(me).hasStatusOk();
		assertThat(me).bodyJson().doesNotHavePath("$.passwordHash").doesNotHavePath("$.password");
		assertThat(me).bodyText().doesNotContain(theDefaultAdmin().passwordHash());
	}

	@Test
	void meGivesStatus401WhenTheRequestHasNoToken() {
		MvcTestResult me = mvc.get().uri(LoginRequests.ME_PATH).exchange();

		assertThat(me).hasStatus(HttpStatus.UNAUTHORIZED).headers().hasHeaderSatisfying(HttpHeaders.WWW_AUTHENTICATE,
				values -> assertThat(values).singleElement().asString().startsWith("Bearer"));
		assertThat(me).bodyText().isEmpty();
	}

	@Test
	void meGivesStatus401WhenTheSessionJwtIsExpired() {
		String sessionJwt = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		CLOCK.set(START.plus(SESSION_JWT_LIFETIME).minusSeconds(1));
		assertThat(LoginRequests.me(mvc, sessionJwt)).hasStatusOk();

		CLOCK.set(START.plus(SESSION_JWT_LIFETIME).plusSeconds(1));
		assertThat(LoginRequests.me(mvc, sessionJwt)).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void meGivesStatus401WhenAnotherKeySignedTheSessionJwt() {
		String sessionJwt = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		String forged = TokenFixture.resignedWithANewKey(sessionJwt);

		assertThat(LoginRequests.me(mvc, sessionJwt)).hasStatusOk();
		assertThat(LoginRequests.me(mvc, forged)).hasStatus(HttpStatus.UNAUTHORIZED);
	}

	private UserDocument theDefaultAdmin() {
		UserDocument admin = mongo.findOne(query(where("username").is(SetupContext.DEFAULT_ADMIN_USERNAME)),
				UserDocument.class);
		assertThat(admin).as("the default admin of the setup").isNotNull();
		return admin;
	}

}
