package io.opencelium.core.auth;

import java.nio.file.Path;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;

import com.jayway.jsonpath.JsonPath;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.fixture.TokenFixture;
import io.opencelium.core.user.UserDocument;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * In the self-host mode an OpenCelium user logs in with the username and the password and gets a session JWT. The
 * default admin of the setup logs in with the admin password {@code 1234}.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class LoginEndpointTest {

	private static final String DAMAGED_USER_HASH = "{noop}hash-of-the-damaged-user";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, LoginEndpointTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	@Test
	void loginGivesASessionJwtWhenTheUsernameAndThePasswordAreCorrect() throws ParseException {
		MvcTestResult login = LoginRequests.logIn(mvc, SetupContext.DEFAULT_ADMIN_USERNAME,
				SetupContext.FIRST_ADMIN_PASSWORD);

		assertThat(login).hasStatusOk();
		SignedJWT sessionJwt = SignedJWT.parse(LoginRequests.sessionJwtOf(login));
		JWTClaimsSet claims = sessionJwt.getJWTClaimsSet();
		assertThat(sessionJwt.getHeader().getType()).isEqualTo(new JOSEObjectType("oc-session+jwt"));
		assertThat(claims.getIssuer()).isEqualTo("opencelium");
		assertThat(claims.getSubject()).isEqualTo(theDefaultAdmin().id());
		assertThat(claims.getStringClaim("tid")).isEqualTo("self-host-tenant");
		assertThat(claims.getStringClaim("sid")).isNotBlank();
		assertThat(claims.getStringListClaim("roles")).containsExactly("ADMIN");
		Instant expiresAt = claims.getExpirationTime().toInstant();
		assertThat(Duration.between(claims.getIssueTime().toInstant(), expiresAt)).isEqualTo(Duration.ofMinutes(15));
		String expiresAtField = JsonPath.read(LoginRequests.bodyOf(login), "$.sessionJwtExpiresAt");
		assertThat(Instant.parse(expiresAtField)).isEqualTo(expiresAt);
	}

	@Test
	void loginGivesStatus401WhenThePasswordIsWrong() {
		MvcTestResult login = LoginRequests.logIn(mvc, SetupContext.DEFAULT_ADMIN_USERNAME, "wrong");

		assertThat(login).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(login).bodyText().doesNotContain("sessionJwt");
	}

	@Test
	void loginGivesASessionJwtWhenTheRequestCarriesAnInvalidBearerToken() {
		String oldSessionJwt = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		String invalid = TokenFixture.resignedWithANewKey(oldSessionJwt);

		MvcTestResult login = mvc.post().uri(LoginRequests.LOGIN_PATH)
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + invalid).contentType(MediaType.APPLICATION_JSON)
				.content(LoginRequests.loginBody(SetupContext.DEFAULT_ADMIN_USERNAME, SetupContext.FIRST_ADMIN_PASSWORD))
				.exchange();

		assertThat(login).hasStatusOk();
		assertThat(LoginRequests.sessionJwtOf(login)).isNotBlank();
	}

	@Test
	void loginGivesStatus400WhenTheUsernameIsLongerThan256Characters() {
		MvcTestResult login = LoginRequests.logIn(mvc, "a".repeat(257), SetupContext.FIRST_ADMIN_PASSWORD);

		assertThat(login).hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(login).bodyText().doesNotContain("sessionJwt");
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void loginWritesNoPasswordToTheLogWhenItRefusesTheBody(CapturedOutput output) {
		String longPassword = "Long-Password-" + "x".repeat(250);
		String body = "{\"username\": \"admin\", \"password\": UnquotedPassword1}";

		assertThat(LoginRequests.logIn(mvc, SetupContext.DEFAULT_ADMIN_USERNAME, longPassword))
				.hasStatus(HttpStatus.BAD_REQUEST);
		assertThat(mvc.post().uri(LoginRequests.LOGIN_PATH).contentType(MediaType.APPLICATION_JSON).content(body))
				.hasStatus(HttpStatus.BAD_REQUEST);

		assertThat(output).doesNotContain("Long-Password-").doesNotContain("UnquotedPassword1");
	}

	@Test
	void loginStopsWithAnErrorWithoutTheStoredValuesWhenTheStoredUserIsDamaged() {
		// A flag that is text: the user cannot be read. The password hash must not reach the error.
		var damaged = new Document("tenantId", "self-host-tenant").append("username", "damaged")
				.append("passwordHash", DAMAGED_USER_HASH).append("locked", "not a flag");
		mongo.getCollection("users").insertOne(damaged);
		try {
			MvcTestResult login = LoginRequests.logIn(mvc, "damaged", "Damaged-Password-1");

			assertThat(login).hasFailed().failure()
					.hasMessageContaining("the OpenCelium user of the name cannot be read");
			// An authentication exception anywhere in the chain would turn the error into a 401 again.
			for (Throwable cause = login.getUnresolvedException(); cause != null; cause = cause.getCause()) {
				assertThat(cause).isNotInstanceOf(AuthenticationException.class);
				assertThat(String.valueOf(cause.getMessage())).doesNotContain(DAMAGED_USER_HASH);
			}
		}
		finally {
			mongo.getCollection("users").deleteOne(new Document("username", "damaged"));
		}
	}

	private UserDocument theDefaultAdmin() {
		UserDocument admin = mongo.findOne(query(where("username").is(SetupContext.DEFAULT_ADMIN_USERNAME)),
				UserDocument.class);
		assertThat(admin).as("the default admin of the setup").isNotNull();
		return admin;
	}

}
