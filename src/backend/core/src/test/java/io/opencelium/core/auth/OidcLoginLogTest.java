package io.opencelium.core.auth;

import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
import org.springframework.http.HttpHeaders;
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
import io.opencelium.core.testsupport.MutableClock;
import io.opencelium.core.testsupport.fake.FakeIdp;

import static io.opencelium.core.testsupport.LoginRequests.assertProblem;
import static io.opencelium.core.testsupport.LoginRequests.exchange;
import static io.opencelium.core.testsupport.OidcLoginRequests.callback;
import static io.opencelium.core.testsupport.OidcLoginRequests.locationOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.loginCodeOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifier;
import static io.opencelium.core.testsupport.OidcLoginRequests.queryOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.s256;
import static io.opencelium.core.testsupport.OidcLoginRequests.saveProviders;
import static io.opencelium.core.testsupport.OidcLoginRequests.start;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * No response and no log line of an OIDC login shows a token or a code of the IdP, or the client secret of the OIDC
 * provider. No log line shows a login code, a login verifier or a token of the session either: a refused exchange
 * writes its error code and a fixed reason. The login is complete: the start, the login at the fake IdP, the answer of
 * the IdP, an exchange with a wrong login verifier, the exchange with the correct one, and a second exchange.
 * <p>
 * The fake IdP is the IdP of the OIDC provider {@code kc}. The fake IdP and core have 1 clock, which starts at the real
 * time: MongoDB deletes a login record and a session record at its end by the real time.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class OidcLoginLogTest {

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final String SUBJECT = "5d4c3b2a-1f0e-4d9c-8b7a-6f5e4d3c2b1a";

	private static final Instant START = Instant.now().truncatedTo(ChronoUnit.SECONDS);

	private static final MutableClock CLOCK = new MutableClock(START);

	private static final FakeIdp IDP = new FakeIdp(CLOCK);

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, OidcLoginLogTest.class, () -> dataDir);
	}

	@TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
	ClientHttpRequestFactory oidcRequestFactory;

	@TestBean
	Clock clock;

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	private final String clientSecret = UUID.randomUUID().toString();

	static ClientHttpRequestFactory fakeIdp() {
		return IDP;
	}

	static Clock clock() {
		return CLOCK;
	}

	/** The case starts with the OIDC provider {@code kc}, and the default admin as the only OpenCelium user. */
	@BeforeEach
	void saveTheProviderWithoutASessionOrAnotherUser() {
		CLOCK.set(START);
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
		mongo.remove(new Query(where("username").ne(SetupContext.DEFAULT_ADMIN_USERNAME)), "users");
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
		IDP.registerClient(CLIENT_ID, clientSecret);
		saveProviders(mvc, CLIENT_ID, clientSecret, Map.of("kc", ISSUER_URL));
		mongo.getCollection("sessions").deleteMany(new Document());
		mongo.getCollection("oidc_logins").deleteMany(new Document());
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void loginShowsNoValueOfTheIdpAndNoTokenOfTheSessionInTheLogOrTheResponsesWhenAnOidcLoginEndsWithAnExchange(
			CapturedOutput output) {
		String loginVerifier = newLoginVerifier();
		String wrongLoginVerifier = newLoginVerifier();
		MvcTestResult start = start(mvc, "kc", s256(loginVerifier));
		String redirect = IDP.login(locationOf(start), SUBJECT, Map.of());
		String idpCode = queryOf(redirect).get("code");
		MvcTestResult callback = callback(mvc, redirect);
		String loginCode = loginCodeOf(callback);
		MvcTestResult wrong = exchange(mvc, loginCode, wrongLoginVerifier);
		MvcTestResult correct = exchange(mvc, loginCode, loginVerifier);
		MvcTestResult second = exchange(mvc, loginCode, loginVerifier);

		assertProblem(wrong, HttpStatus.UNAUTHORIZED, "invalid-login-verifier");
		assertThat(correct).as("the exchange with the correct login verifier").hasStatusOk();
		assertProblem(second, HttpStatus.UNAUTHORIZED, "session-ended");
		List<String> idpTokens = IDP.issuedTokens();
		assertThat(idpTokens).as("the ID token and the access token of the IdP").isNotEmpty();
		assertThat(idpCode).as("the code of the IdP").isNotBlank();
		List<String> valuesOfTheIdp = new ArrayList<>(idpTokens);
		valuesOfTheIdp.add(idpCode);
		valuesOfTheIdp.add(clientSecret);
		Map<String, MvcTestResult> responses = Map.of("the start", start, "the answer of the IdP", callback,
				"the exchange with a wrong login verifier", wrong, "the exchange", correct, "the second exchange",
				second);
		responses.forEach((name, response) -> assertThat(textOf(response)).as("the response of %s", name)
			.doesNotContain(valuesOfTheIdp));
		String log = output.getAll();
		assertThat(log).as("the log").contains("invalid-login-verifier").contains("session-ended")
			.doesNotContain(valuesOfTheIdp)
			.doesNotContain(loginCode, loginVerifier, wrongLoginVerifier)
			.doesNotContain(LoginRequests.sessionJwtOf(correct), LoginRequests.refreshTokenOf(correct));
	}

	/** The header {@code Location} and the body of the response. */
	private static String textOf(MvcTestResult response) {
		String location = response.getResponse().getHeader(HttpHeaders.LOCATION);
		return (location != null ? location : "") + "\n" + LoginRequests.bodyOf(response);
	}

}
