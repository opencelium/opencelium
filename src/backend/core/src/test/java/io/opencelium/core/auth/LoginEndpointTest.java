package io.opencelium.core.auth;

import java.nio.file.Path;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;

import com.jayway.jsonpath.JsonPath;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
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

	private UserDocument theDefaultAdmin() {
		UserDocument admin = mongo.findOne(query(where("username").is(SetupContext.DEFAULT_ADMIN_USERNAME)),
				UserDocument.class);
		assertThat(admin).as("the default admin of the setup").isNotNull();
		return admin;
	}

}
