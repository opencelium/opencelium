package io.opencelium.core.auth;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.fake.FakeIdp;

import static io.opencelium.core.testsupport.OidcLoginRequests.callback;
import static io.opencelium.core.testsupport.OidcLoginRequests.logInAtTheIdp;
import static io.opencelium.core.testsupport.OidcLoginRequests.loginCodeOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifierHash;
import static io.opencelium.core.testsupport.OidcLoginRequests.saveProviders;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * An OpenCelium user that an OIDC login made has no password. A login with its username and any password is a failed
 * login like one with a name that no user has: the status code 401 with the error code {@code invalid-credentials}, the
 * same body, and no error and no stack trace in the log.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class OidcUserLocalLoginTest {

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final String ADMIN = SetupContext.DEFAULT_ADMIN_USERNAME;

	private static final FakeIdp IDP = new FakeIdp();

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, OidcUserLocalLoginTest.class, () -> dataDir);
	}

	@TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
	ClientHttpRequestFactory oidcRequestFactory;

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	private final String clientSecret = UUID.randomUUID().toString();

	static ClientHttpRequestFactory fakeIdp() {
		return IDP;
	}

	/** Each case starts with the OIDC provider {@code kc}, and the default admin as the only OpenCelium user. */
	@BeforeEach
	void saveTheProviderWithoutAnotherUser() {
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
		mongo.remove(new Query(where("username").ne(ADMIN)), "users");
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
		IDP.registerClient(CLIENT_ID, clientSecret);
		saveProviders(mvc, CLIENT_ID, clientSecret, Map.of("kc", ISSUER_URL));
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void loginGivesInvalidCredentialsWithoutAnErrorInTheLogWhenTheUsernameIsOfAnOpenCeliumUserWithoutAPassword(
			CapturedOutput output) {
		String username = usernameOfTheNewUser();

		MvcTestResult login = LoginRequests.logIn(mvc, username, "Any-Password-1");

		LoginRequests.assertProblem(login, HttpStatus.UNAUTHORIZED, "invalid-credentials");
		assertThat(LoginRequests.bodyOf(login)).as("the body of the failed login")
			.isEqualTo(LoginRequests.bodyOf(LoginRequests.logIn(mvc, "nobody", "Any-Password-1")));
		assertThat(output).contains("invalid-credentials").doesNotContain("Exception").doesNotContain("\n\tat ");
	}

	/** A complete OIDC login of a new person, and the username of the OpenCelium user that core made for it. */
	private String usernameOfTheNewUser() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), UUID.randomUUID().toString(), Map.of());
		loginCodeOf(callback(mvc, redirect));
		List<Document> users = mongo.getCollection("users")
			.find(new Document("username", new Document("$ne", ADMIN)))
			.into(new ArrayList<>());
		assertThat(users).as("the OpenCelium users other than the default admin").hasSize(1);
		assertThat(users.getFirst().get("passwordHash")).as("the password hash of the new OpenCelium user").isNull();
		return users.getFirst().getString("username");
	}

}
