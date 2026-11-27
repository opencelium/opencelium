package io.opencelium.core.auth;

import java.nio.file.Path;
import java.text.ParseException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.stream.Stream;

import com.jayway.jsonpath.JsonPath;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
import io.opencelium.core.testsupport.OidcLoginRequests;
import io.opencelium.core.testsupport.fake.FakeIdp;
import io.opencelium.core.testsupport.fixture.TokenFixture;

import static io.opencelium.core.testsupport.LoginRequests.assertProblem;
import static io.opencelium.core.testsupport.LoginRequests.exchange;
import static io.opencelium.core.testsupport.LoginRequests.exchangeBody;
import static io.opencelium.core.testsupport.LoginRequests.exchangeWithBody;
import static io.opencelium.core.testsupport.LoginRequests.me;
import static io.opencelium.core.testsupport.LoginRequests.refresh;
import static io.opencelium.core.testsupport.LoginRequests.refreshTokenOf;
import static io.opencelium.core.testsupport.LoginRequests.sessionJwtOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.callback;
import static io.opencelium.core.testsupport.OidcLoginRequests.logInAtTheIdp;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifier;
import static io.opencelium.core.testsupport.OidcLoginRequests.s256;
import static io.opencelium.core.testsupport.OidcLoginRequests.saveProviders;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * After an OIDC login the HTTP client exchanges the login code for the 2 tokens of the session that the login started:
 * it sends the login code as the bearer token and its login verifier in the body. The response has a session JWT of
 * the OpenCelium user of the login and a refresh token, and the refresh and the logout work with them.
 * <ul>
 * <li>Only the HTTP client that started the login can exchange the login code: a login verifier whose hash is not the
 * hash of the start gets {@code invalid-login-verifier}, and the login code stays valid. A body without a login
 * verifier, a body that is not JSON, and a login verifier of another form get {@code bad-request}, and the login code
 * stays valid. A login verifier has 43 to 128 characters: the letters A to Z and a to z, the digits, {@code -},
 * {@code .}, {@code _} and {@code ~}. A character outside ASCII never takes the place of another character.</li>
 * <li>A login code expires 1 minute after its issue, and it has 1 use: a second use gets {@code session-ended} and ends
 * the session, but the session JWT of the first exchange stays valid until it expires. A second use with a wrong login
 * verifier ends nothing. Of 2 exchanges of 1 login code at the same time, exactly 1 gives the tokens, and the session
 * ends.</li>
 * <li>An exchange for a locked or deleted OpenCelium user gets {@code session-ended} and ends the session.</li>
 * <li>A request without a valid login code gets the status code 401 with the header {@code WWW-Authenticate} and no
 * body, also with a session JWT or a refresh token. Each of these cases also exchanges a valid login code, so that the
 * case shows the refusal of the token and not a missing endpoint.</li>
 * </ul>
 * The fake IdP is the IdP of the OIDC provider {@code kc}. The fake IdP and core have 1 clock, which starts at the real
 * time: MongoDB deletes a login record and a session record at its end by the real time.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class LoginCodeExchangeTest {

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final String SUBJECT = "0b7c6d5e-4f30-4a21-9b8c-7d6e5f4a3b2c";

	private static final String SELF_HOST_TENANT = "self-host-tenant";

	private static final Duration LIFE_OF_A_LOGIN_CODE = Duration.ofMinutes(1);

	private static final Duration SESSION_JWT_LIFETIME = Duration.ofMinutes(15);

	/** Each round is a new OIDC login with 2 exchanges at the same time; more rounds give more orders of the 2. */
	private static final int PARALLEL_ROUNDS = 20;

	private static final Instant START = Instant.now().truncatedTo(ChronoUnit.SECONDS);

	private static final MutableClock CLOCK = new MutableClock(START);

	private static final FakeIdp IDP = new FakeIdp(CLOCK);

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, LoginCodeExchangeTest.class, () -> dataDir);
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

	/**
	 * Each case starts at the start time with the OIDC provider {@code kc}, the default admin as the only OpenCelium
	 * user, and no session and no login record: the save of the OIDC provider needs a session of the default admin.
	 */
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
	void exchangeGivesASessionJwtOfTheOpenCeliumUserOfTheLoginWhenTheLoginVerifierIsCorrect() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult exchange = exchange(mvc, loginCode, loginVerifier);

		assertThat(exchange).as("the exchange").hasStatusOk();
		String sessionJwt = sessionJwtOf(exchange);
		assertThat(claimsOf(sessionJwt).getSubject()).as("the OpenCelium user of the session JWT")
			.isEqualTo(claimsOf(loginCode).getSubject());
		assertThat(sessionIdOf(sessionJwt)).as("the session of the session JWT").isEqualTo(sessionIdOf(loginCode));
		MvcTestResult me = me(mvc, sessionJwt);
		assertThat(me).as("the current OpenCelium user with the session JWT").hasStatusOk();
		Document user = theOnlyNewUser();
		assertThat(stringOf(me, "$.id")).as("the ID of the current OpenCelium user").isEqualTo(idOf(user));
		assertThat(stringOf(me, "$.username")).as("the username of the current OpenCelium user")
			.isEqualTo(user.getString("username"));
		assertThat(stringOf(me, "$.tenantId")).as("the tenant of the current OpenCelium user")
			.isEqualTo(SELF_HOST_TENANT);
	}

	@Test
	void exchangeGivesARefreshTokenThatRefreshesAndEndsTheSessionWhenTheLoginVerifierIsCorrect() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult exchange = exchange(mvc, loginCode, loginVerifier);

		assertThat(exchange).as("the exchange").hasStatusOk();
		String refreshToken = refreshTokenOf(exchange);
		assertThat(sessionIdOf(refreshToken)).as("the session of the refresh token").isEqualTo(sessionIdOf(loginCode));
		MvcTestResult refresh = refresh(mvc, refreshToken);
		assertThat(refresh).as("the refresh with the refresh token of the exchange").hasStatusOk();
		MvcTestResult logout = LoginRequests.logOut(mvc, refreshTokenOf(refresh));
		assertThat(logout).as("the logout with the refresh token of the refresh").hasStatus(HttpStatus.NO_CONTENT);
		assertThat(sessionRecord(sessionIdOf(loginCode))).as("the session record after the logout").isNull();
	}

	@Test
	void exchangeGivesInvalidLoginVerifierAndKeepsTheLoginCodeValidWhenTheLoginVerifierIsWrong() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult wrong = exchange(mvc, loginCode, newLoginVerifier());

		assertProblem(wrong, HttpStatus.UNAUTHORIZED, "invalid-login-verifier");
		MvcTestResult correct = exchange(mvc, loginCode, loginVerifier);
		assertThat(correct).as("the exchange with the correct login verifier after the wrong one").hasStatusOk();
		assertThat(me(mvc, sessionJwtOf(correct))).as("the session JWT of the exchange").hasStatusOk();
	}

	@Test
	void exchangeGivesInvalidLoginVerifierWhenTheLoginVerifierIsTheHashThatTheLoginCodeHolds() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult withTheHash = exchange(mvc, loginCode, s256(loginVerifier));

		assertProblem(withTheHash, HttpStatus.UNAUTHORIZED, "invalid-login-verifier");
		assertThat(exchange(mvc, loginCode, loginVerifier)).as("the exchange with the correct login verifier")
			.hasStatusOk();
	}

	@Test
	void exchangeGivesBadRequestWhenTheBodyHasNoLoginVerifier() {
		String loginCode = loginCodeFor(newLoginVerifier());

		MvcTestResult exchange = exchangeWithBody(mvc, loginCode, "{}");

		assertProblem(exchange, HttpStatus.BAD_REQUEST, "bad-request");
	}

	@Test
	void exchangeGivesBadRequestWhenTheBodyIsNotJson() {
		String loginCode = loginCodeFor(newLoginVerifier());

		MvcTestResult exchange = exchangeWithBody(mvc, loginCode, "this is not JSON");

		assertProblem(exchange, HttpStatus.BAD_REQUEST, "bad-request");
	}

	@Test
	void exchangeGivesBadRequestWhenTheBodyIsAForm() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult exchange = mvc.post().uri(LoginRequests.LOGIN_CODE_PATH)
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + loginCode)
			.contentType(MediaType.APPLICATION_FORM_URLENCODED)
			.content("loginVerifier=" + loginVerifier)
			.exchange();

		assertProblem(exchange, HttpStatus.BAD_REQUEST, "bad-request");
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("loginVerifiersOfAnotherForm")
	void exchangeGivesBadRequestAndKeepsTheLoginCodeValidWhenTheLoginVerifierHasAnotherForm(String form,
			String otherForm) {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult exchange = exchange(mvc, loginCode, otherForm);

		assertProblem(exchange, HttpStatus.BAD_REQUEST, "bad-request");
		assertThat(exchange(mvc, loginCode, loginVerifier)).as("the exchange with the correct login verifier")
			.hasStatusOk();
	}

	/** The name of each form, and a value of that form; no value needs a JSON escape. */
	static Stream<Arguments> loginVerifiersOfAnotherForm() {
		return Stream.of(arguments("an empty login verifier", ""), arguments("42 characters", "a".repeat(42)),
				arguments("129 characters", "a".repeat(129)),
				arguments("a character outside ASCII", "é" + "a".repeat(42)),
				arguments("a character of ASCII outside the form", "+" + "a".repeat(42)));
	}

	@Test
	void exchangeGivesBadRequestWithoutTokensWhenTheLoginVerifierHasACharacterOutsideAsciiInPlaceOfAQuestionMark() {
		String tail = "a".repeat(42);
		String loginCode = loginCodeFor("?" + tail);

		MvcTestResult exchange = exchange(mvc, loginCode, "é" + tail);

		assertProblem(exchange, HttpStatus.BAD_REQUEST, "bad-request");
		assertThat(sessionRecord(sessionIdOf(loginCode))).as("the session record").isNotNull()
			.containsEntry("codeId", claimsOf(loginCode).getJWTID());
	}

	@Test
	void exchangeGivesTheTokensWhenTheLoginVerifierHas128CharactersOfEachKindOfTheForm() {
		String loginVerifier = "-._~" + "Az09".repeat(31);
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult exchange = exchange(mvc, loginCode, loginVerifier);

		assertThat(exchange).as("the exchange with a login verifier of 128 characters").hasStatusOk();
		assertThat(me(mvc, sessionJwtOf(exchange))).as("the session JWT of the exchange").hasStatusOk();
	}

	@Test
	void exchangeGivesTheTokensWhenTheLoginCodeComesOneSecondBeforeTheEndOfItsLife() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		CLOCK.advance(LIFE_OF_A_LOGIN_CODE.minusSeconds(1));

		MvcTestResult exchange = exchange(mvc, loginCode, loginVerifier);

		assertThat(exchange).as("the exchange 1 second before the end of the life of the login code").hasStatusOk();
		assertThat(me(mvc, sessionJwtOf(exchange))).as("the session JWT of the exchange").hasStatusOk();
	}

	@Test
	void exchangeGivesStatus401WithoutABodyWhenTheLoginCodeComesOneSecondAfterTheEndOfItsLife() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		CLOCK.advance(LIFE_OF_A_LOGIN_CODE.plusSeconds(1));

		MvcTestResult exchange = exchange(mvc, loginCode, loginVerifier);

		assertRefusedWithoutABody(exchange);
		String laterLoginVerifier = newLoginVerifier();
		assertThat(exchange(mvc, loginCodeFor(laterLoginVerifier), laterLoginVerifier))
			.as("the exchange of the login code of a new login at the same time").hasStatusOk();
	}

	@Test
	void exchangeGivesSessionEndedAndEndsTheSessionWhenTheLoginCodeComesASecondTime() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		MvcTestResult first = exchange(mvc, loginCode, loginVerifier);
		assertThat(first).as("the first exchange").hasStatusOk();

		MvcTestResult second = exchange(mvc, loginCode, loginVerifier);

		assertProblem(second, HttpStatus.UNAUTHORIZED, "session-ended");
		assertThat(sessionRecord(sessionIdOf(loginCode))).as("the session record after the second use").isNull();
		assertProblem(refresh(mvc, refreshTokenOf(first)), HttpStatus.UNAUTHORIZED, "session-ended");
	}

	@Test
	void exchangeGivesTheTokensOnceAndEndsTheSessionWhenTwoExchangesOfOneLoginCodeComeAtTheSameTime()
			throws Exception {
		try (ExecutorService threads = Executors.newVirtualThreadPerTaskExecutor()) {
			for (int round = 1; round <= PARALLEL_ROUNDS; round++) {
				String loginVerifier = newLoginVerifier();
				String loginCode = loginCodeFor(loginVerifier);
				var together = new CyclicBarrier(2);
				Callable<MvcTestResult> attempt = () -> {
					together.await(10, TimeUnit.SECONDS);
					return exchange(mvc, loginCode, loginVerifier);
				};
				Future<MvcTestResult> first = threads.submit(attempt);
				Future<MvcTestResult> second = threads.submit(attempt);
				List<MvcTestResult> results = List.of(first.get(30, TimeUnit.SECONDS),
						second.get(30, TimeUnit.SECONDS));

				List<MvcTestResult> winners = results.stream()
					.filter(result -> result.getResponse().getStatus() == HttpStatus.OK.value())
					.toList();
				assertThat(winners).as("round %d: the exchanges that gave tokens", round).hasSize(1);
				MvcTestResult winner = winners.getFirst();
				assertThat(sessionJwtOf(winner)).as("round %d: the session JWT of the exchange that gave tokens", round)
					.isNotBlank();
				MvcTestResult loser = results.stream().filter(result -> result != winner).findFirst().orElseThrow();
				assertProblem(loser, HttpStatus.UNAUTHORIZED, "session-ended");
				assertThat(sessionRecord(sessionIdOf(loginCode))).as("round %d: the session record", round).isNull();
				assertProblem(refresh(mvc, refreshTokenOf(winner)), HttpStatus.UNAUTHORIZED, "session-ended");
			}
		}
	}

	@Test
	void meAcceptsTheSessionJwtOfTheFirstExchangeUntilItExpiresWhenTheLoginCodeComesASecondTime() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		MvcTestResult first = exchange(mvc, loginCode, loginVerifier);
		assertThat(first).as("the first exchange").hasStatusOk();
		String sessionJwt = sessionJwtOf(first);
		assertProblem(exchange(mvc, loginCode, loginVerifier), HttpStatus.UNAUTHORIZED, "session-ended");

		assertThat(me(mvc, sessionJwt)).as("the session JWT of the first exchange after the second use")
			.hasStatusOk();

		CLOCK.set(START.plus(SESSION_JWT_LIFETIME).plusSeconds(1));
		assertThat(me(mvc, sessionJwt)).as("the session JWT of the first exchange after its expiry")
			.hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void exchangeGivesInvalidLoginVerifierAndKeepsTheSessionWhenTheLoginCodeComesASecondTimeWithAWrongLoginVerifier() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		MvcTestResult first = exchange(mvc, loginCode, loginVerifier);
		assertThat(first).as("the first exchange").hasStatusOk();

		MvcTestResult second = exchange(mvc, loginCode, newLoginVerifier());

		assertProblem(second, HttpStatus.UNAUTHORIZED, "invalid-login-verifier");
		assertThat(sessionRecord(sessionIdOf(loginCode))).as("the session record after the second use").isNotNull();
		assertThat(refresh(mvc, refreshTokenOf(first))).as("the refresh with the refresh token of the first exchange")
			.hasStatusOk();
	}

	@Test
	void exchangeGivesSessionEndedAndEndsTheSessionWhenTheOpenCeliumUserIsLocked() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		mongo.getCollection("users").updateOne(new Document("_id", theOnlyNewUser().get("_id")),
				new Document("$set", new Document("locked", true)));

		MvcTestResult exchange = exchange(mvc, loginCode, loginVerifier);

		assertProblem(exchange, HttpStatus.UNAUTHORIZED, "session-ended");
		assertThat(sessionRecord(sessionIdOf(loginCode))).as("the session record after the exchange").isNull();
	}

	@Test
	void exchangeGivesSessionEndedAndEndsTheSessionWhenTheOpenCeliumUserIsDeleted() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		mongo.getCollection("users").deleteOne(new Document("_id", theOnlyNewUser().get("_id")));

		MvcTestResult exchange = exchange(mvc, loginCode, loginVerifier);

		assertProblem(exchange, HttpStatus.UNAUTHORIZED, "session-ended");
		assertThat(sessionRecord(sessionIdOf(loginCode))).as("the session record after the exchange").isNull();
	}

	@Test
	void exchangeGivesStatus401WithoutABodyWhenTheBearerTokenIsASessionJwt() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		String sessionJwt = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		MvcTestResult exchange = exchange(mvc, sessionJwt, loginVerifier);

		assertRefusedWithoutABody(exchange);
		assertThat(exchange(mvc, loginCode, loginVerifier)).as("the exchange with the login code").hasStatusOk();
	}

	@Test
	void exchangeGivesStatus401WithoutABodyWhenTheBearerTokenIsARefreshToken() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);
		String refreshToken = refreshTokenOf(LoginRequests.logInAsTheDefaultAdmin(mvc));

		MvcTestResult exchange = exchange(mvc, refreshToken, loginVerifier);

		assertRefusedWithoutABody(exchange);
		assertThat(exchange(mvc, loginCode, loginVerifier)).as("the exchange with the login code").hasStatusOk();
	}

	@Test
	void exchangeGivesStatus401WithoutABodyWhenTheLoginCodeHasTheSignatureOfAnotherKey() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult exchange = exchange(mvc, TokenFixture.resignedWithANewKey(loginCode), loginVerifier);

		assertRefusedWithoutABody(exchange);
		assertThat(exchange(mvc, loginCode, loginVerifier)).as("the exchange with the login code").hasStatusOk();
	}

	@Test
	void exchangeGivesStatus401WithoutABodyWhenTheRequestHasNoBearerToken() {
		String loginVerifier = newLoginVerifier();
		String loginCode = loginCodeFor(loginVerifier);

		MvcTestResult exchange = mvc.post().uri(LoginRequests.LOGIN_CODE_PATH).contentType(MediaType.APPLICATION_JSON)
			.content(exchangeBody(loginVerifier))
			.exchange();

		assertRefusedWithoutABody(exchange);
		assertThat(exchange(mvc, loginCode, loginVerifier)).as("the exchange with the login code").hasStatusOk();
	}

	/** The login code of a complete OIDC login of {@link #SUBJECT} at {@code kc}, started with the login verifier. */
	private String loginCodeFor(String loginVerifier) {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", s256(loginVerifier), SUBJECT, Map.of());
		return OidcLoginRequests.loginCodeOf(callback(mvc, redirect));
	}

	/** The answer to a request without a valid bearer token: 401, the header {@code WWW-Authenticate}, no body. */
	private static void assertRefusedWithoutABody(MvcTestResult response) {
		assertThat(response).hasStatus(HttpStatus.UNAUTHORIZED).headers().hasHeaderSatisfying(
				HttpHeaders.WWW_AUTHENTICATE, values -> assertThat(values).singleElement().asString().startsWith("Bearer"));
		assertThat(response).bodyText().isEmpty();
	}

	/** The claims of a signed token of core, without a check of its signature. */
	private static JWTClaimsSet claimsOf(String token) {
		try {
			return SignedJWT.parse(token).getJWTClaimsSet();
		}
		catch (ParseException ex) {
			throw new AssertionError("The token is not a signed JWT.", ex);
		}
	}

	private static String sessionIdOf(String token) {
		try {
			return claimsOf(token).getStringClaim("sid");
		}
		catch (ParseException ex) {
			throw new AssertionError("The claim sid of the token is not a text.", ex);
		}
	}

	private static String stringOf(MvcTestResult response, String path) {
		return JsonPath.read(LoginRequests.bodyOf(response), path);
	}

	private Document sessionRecord(String sessionId) {
		return mongo.getCollection("sessions").find(new Document("_id", sessionId)).first();
	}

	private Document theOnlyNewUser() {
		List<Document> users = mongo.getCollection("users")
			.find(new Document("username", new Document("$ne", SetupContext.DEFAULT_ADMIN_USERNAME)))
			.into(new ArrayList<>());
		assertThat(users).as("the OpenCelium users other than the default admin").hasSize(1);
		return users.getFirst();
	}

	private static String idOf(Document user) {
		return String.valueOf(user.get("_id"));
	}

}
