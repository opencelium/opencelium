package io.opencelium.core.auth;

import java.net.URI;
import java.nio.file.Path;
import java.text.ParseException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import com.nimbusds.jose.JOSEObjectType;
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
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.secrets.keys.TokenSignature;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.MutableClock;
import io.opencelium.core.testsupport.fake.FakeIdp;
import io.opencelium.core.testsupport.fake.FakeIdp.IdTokenSignature;
import io.opencelium.core.testsupport.fixture.TokenFixture;
import io.opencelium.core.testsupport.fixture.UserFixture;

import static io.opencelium.core.testsupport.OidcLoginRequests.CALLBACK_PATH;
import static io.opencelium.core.testsupport.OidcLoginRequests.assertErrorRedirect;
import static io.opencelium.core.testsupport.OidcLoginRequests.callback;
import static io.opencelium.core.testsupport.OidcLoginRequests.locationOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.logInAtTheIdp;
import static io.opencelium.core.testsupport.OidcLoginRequests.loginCodeOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifier;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifierHash;
import static io.opencelium.core.testsupport.OidcLoginRequests.queryOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.s256;
import static io.opencelium.core.testsupport.OidcLoginRequests.saveProviders;
import static io.opencelium.core.testsupport.OidcLoginRequests.start;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * At the redirect URI of an OIDC provider core completes the login of the browser. For a correct answer of the IdP it
 * starts a session and redirects the browser to {@code /login/oidc#code=} with a login code. The session record holds
 * the code ID of the login code. The login code is a signed token of its own type: it names the OpenCelium user, the
 * tenant and the session, has a code ID and the hash of the login verifier of the start, and holds no code and no
 * token of the IdP. Core does not accept it as a session JWT or as a refresh token.
 * <p>
 * A wrong answer starts no session and redirects the browser to {@code /login/oidc#error=} with an error code:
 * <ul>
 * <li>{@code login-expired}: the state names no login record of the OIDC provider, the answer comes a second time,
 * or it comes after the 10 minutes of the login;</li>
 * <li>{@code unknown-provider}: no OIDC provider has the provider ID;</li>
 * <li>{@code idp-error}: the IdP answers with an error, refuses the token request, or gives no discovery document;</li>
 * <li>{@code invalid-id-token}: the ID token has a wrong issuer, audience, signature or nonce, or it expired;</li>
 * <li>{@code user-locked}: the OIDC link or the email of the ID token gives a locked OpenCelium user;</li>
 * <li>{@code email-taken}: core must make a new OpenCelium user with the verified email of the ID token, and another
 * OpenCelium user has that email, compared without a difference between upper case and lower case. Without the
 * email-link option of the OIDC provider of the login, the email does not give that OpenCelium user: the option of
 * another OIDC provider does not apply.</li>
 * </ul>
 * The 2 refusals of the OpenCelium user make no OpenCelium user and change no OpenCelium user: a locked OpenCelium user
 * gets no OIDC link. Core reads and deletes the login record of an answer, so an answer has 1 use. The endpoint is
 * open, and it ignores a bearer token.
 * <p>
 * The fake IdP is the IdP of the OIDC providers {@code kc}, {@code kc2} and {@code stopped}: it keeps a code for each
 * login of a person, and its token endpoint accepts a code once, with the PKCE verifier, the redirect URI and the
 * client secret of its login. The email-link option of each OIDC provider is off, unless a case turns it on. The fake
 * IdP and core have 1 clock, which starts at the real time: MongoDB deletes a login record at its end by the real
 * time. Core keeps the discovery document of an issuer URL for 5 minutes, so the case that removes a discovery document
 * has an issuer URL of its own: a document that core keeps from another case does not change its result.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class OidcCallbackTest {

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String OTHER_ISSUER_URL = "https://idp2.example.com/realms/oc";

	/** The issuer URL of the case whose IdP stops serving its discovery document. */
	private static final String STOPPED_ISSUER_URL = "https://stopped-idp.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final String SUBJECT = "f3a1c2d4-5b6e-4f70-8a91-b2c3d4e5f607";

	private static final Map<String, String> PROVIDERS = Map.of("kc", ISSUER_URL, "kc2", OTHER_ISSUER_URL, "stopped",
			STOPPED_ISSUER_URL);

	private static final String BOB_EMAIL = "bob@example.com";

	private static final String CAROL_EMAIL = "carol@example.com";

	private static final String SELF_HOST_TENANT = "self-host-tenant";

	private static final String SESSION_JWT_TYPE = "oc-session+jwt";

	private static final String REFRESH_TOKEN_TYPE = "oc-refresh+jwt";

	private static final String ISSUER_OF_CORE = "opencelium";

	private static final Duration LIFE_OF_A_LOGIN = Duration.ofMinutes(10);

	private static final Duration LIFE_OF_A_KEPT_DISCOVERY_DOCUMENT = Duration.ofMinutes(5);

	private static final Instant START = Instant.now().truncatedTo(ChronoUnit.MILLIS);

	private static final MutableClock CLOCK = new MutableClock(START);

	private static final FakeIdp IDP = new FakeIdp(CLOCK);

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, OidcCallbackTest.class, () -> dataDir);
	}

	@TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
	ClientHttpRequestFactory oidcRequestFactory;

	@TestBean
	Clock clock;

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	@Autowired
	TokenSignature signature;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	TenantDocuments documents;

	private final String clientSecret = UUID.randomUUID().toString();

	static ClientHttpRequestFactory fakeIdp() {
		return IDP;
	}

	static Clock clock() {
		return CLOCK;
	}

	/**
	 * Each case starts at the start time with the OIDC providers {@code kc}, {@code kc2} and {@code stopped}, the
	 * default admin as the only OpenCelium user, and no session and no login record: the save of the OIDC providers
	 * needs a session of the default admin.
	 */
	@BeforeEach
	void saveTheProvidersWithoutASessionOrAnotherUser() {
		CLOCK.set(START);
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
		mongo.remove(new Query(where("username").ne(SetupContext.DEFAULT_ADMIN_USERNAME)), "users");
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
		IDP.serveDiscoveryDocument(OTHER_ISSUER_URL);
		IDP.serveDiscoveryDocument(STOPPED_ISSUER_URL);
		IDP.registerClient(CLIENT_ID, clientSecret);
		saveProviders(mvc, CLIENT_ID, clientSecret, PROVIDERS);
		mongo.getCollection("sessions").deleteMany(new Document());
		mongo.getCollection("oidc_logins").deleteMany(new Document());
	}

	@Test
	void callbackRedirectsTheBrowserToTheFrontendWithALoginCodeWhenTheAnswerOfTheIdpIsCorrect() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());

		MvcTestResult callback = callback(mvc, redirect);

		assertThat(loginCodeOf(callback)).as("the login code").isNotBlank();
	}

	@Test
	void callbackStartsASessionOfTheNewOpenCeliumUserWithTheCodeIdOfTheLoginCodeWhenTheAnswerOfTheIdpIsCorrect() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());

		Jwt loginCode = decoded(loginCodeOf(callback(mvc, redirect)));

		List<Document> sessions = sessions();
		assertThat(sessions).as("the sessions").hasSize(1);
		Document session = sessions.getFirst();
		assertThat(String.valueOf(session.get("_id"))).as("the session ID")
			.isEqualTo(loginCode.getClaimAsString("sid"));
		assertThat(session.getString("tenantId")).isEqualTo(SELF_HOST_TENANT);
		assertThat(session.getString("userId")).as("the OpenCelium user of the session")
			.isEqualTo(loginCode.getSubject())
			.isEqualTo(idOf(theOnlyNewUser()));
		assertThat(loginCode.getId()).as("the code ID of the login code").isNotBlank();
		assertThat(session.values()).as("the values of the session record").contains(loginCode.getId());
		assertThat(session.toJson()).as("the session record").doesNotContain(loginCode.getTokenValue());
	}

	@Test
	void callbackGivesALoginCodeOfItsOwnTypeWithTheUserTheTenantTheSessionACodeIdAndTheHashWhenTheAnswerIsCorrect() {
		String loginVerifierHash = s256(newLoginVerifier());
		String redirect = logInAtTheIdp(mvc, IDP, "kc", loginVerifierHash, SUBJECT, Map.of());

		String loginCode = loginCodeOf(callback(mvc, redirect));

		String type = typeOf(loginCode);
		assertThat(type).as("the type of the login code").isNotBlank().isNotEqualTo(SESSION_JWT_TYPE)
			.isNotEqualTo(REFRESH_TOKEN_TYPE);
		Jwt claims = signature.decoder(type, ISSUER_OF_CORE).decode(loginCode);
		assertThat(claims.getSubject()).as("the OpenCelium user").isEqualTo(idOf(theOnlyNewUser()));
		assertThat(claims.getClaimAsString("tid")).as("the tenant").isEqualTo(SELF_HOST_TENANT);
		assertThat(claims.getClaimAsString("sid")).as("the session")
			.isEqualTo(String.valueOf(sessions().getFirst().get("_id")));
		assertThat(claims.getId()).as("the code ID").isNotBlank();
		assertThat(claims.getClaims().values()).as("the claims of the login code").contains(loginVerifierHash);
	}

	@Test
	void callbackGivesALoginCodeWithoutACodeOrATokenOfTheIdpWhenTheAnswerIsCorrect() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		String idpCode = queryOf(redirect).get("code");

		MvcTestResult callback = callback(mvc, redirect);

		String location = locationOf(callback);
		String claims = decoded(loginCodeOf(callback)).getClaims().toString();
		List<String> idpTokens = IDP.issuedTokens();
		assertThat(idpTokens).as("the tokens of the IdP").isNotEmpty();
		assertThat(location).doesNotContain(idpCode);
		assertThat(claims).doesNotContain(idpCode);
		for (String token : idpTokens) {
			assertThat(location).doesNotContain(token);
			assertThat(claims).doesNotContain(token);
		}
	}

	@Test
	void callbackGivesALoginCodeThatCoreRefusesAsASessionJwtAndAsARefreshTokenWhenTheAnswerIsCorrect() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		String loginCode = loginCodeOf(callback(mvc, redirect));

		assertThat(LoginRequests.me(mvc, loginCode)).as("the login code as a session JWT")
			.hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(LoginRequests.refresh(mvc, loginCode)).as("the login code as a refresh token")
			.hasStatus(HttpStatus.UNAUTHORIZED);
	}

	@Test
	void callbackDeletesTheLoginRecordWhenTheAnswerOfTheIdpIsCorrect() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());

		loginCodeOf(callback(mvc, redirect));

		assertThat(loginRecords()).as("the login records").isEmpty();
	}

	@Test
	void callbackRedirectsWithALoginCodeWhenTheRequestCarriesAnInvalidBearerToken() {
		String invalid = TokenFixture.resignedWithANewKey(LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());

		MvcTestResult callback = mvc.get().uri(URI.create(redirect))
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + invalid)
			.exchange();

		assertThat(loginCodeOf(callback)).as("the login code").isNotBlank();
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfLoginExpiredWithoutASecondSessionWhenTheAnswerComesASecondTime() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		loginCodeOf(callback(mvc, redirect));

		MvcTestResult second = callback(mvc, redirect);

		assertErrorRedirect(second, "login-expired");
		assertThat(sessions()).as("the sessions").hasSize(1);
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfLoginExpiredWithoutASessionWhenTheAnswerComesOneSecondAfterTheEnd() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		CLOCK.advance(LIFE_OF_A_LOGIN.plusSeconds(1));

		MvcTestResult callback = callback(mvc, redirect);

		assertErrorRedirect(callback, "login-expired");
		assertThat(sessions()).as("the sessions").isEmpty();
	}

	@Test
	void callbackStartsASessionWhenTheAnswerComesOneSecondBeforeTheEndOfTheLogin() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		CLOCK.advance(LIFE_OF_A_LOGIN.minusSeconds(1));

		MvcTestResult callback = callback(mvc, redirect);

		assertThat(loginCodeOf(callback)).as("the login code").isNotBlank();
		assertThat(sessions()).as("the sessions").hasSize(1);
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfLoginExpiredWithoutASessionWhenTheStateNamesNoLogin() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		String code = queryOf(redirect).get("code");

		MvcTestResult callback = mvc.get().uri(CALLBACK_PATH, "kc").param("code", code)
			.param("state", UUID.randomUUID().toString())
			.exchange();

		assertErrorRedirect(callback, "login-expired");
		assertThat(sessions()).as("the sessions").isEmpty();
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfLoginExpiredWithoutASessionWhenTheLoginIsOfAnotherProvider() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		String redirectOfAnotherProvider = redirect.replace("/api/auth/oidc/kc/callback",
				"/api/auth/oidc/kc2/callback");

		MvcTestResult callback = callback(mvc, redirectOfAnotherProvider);

		assertErrorRedirect(callback, "login-expired");
		assertThat(sessions()).as("the sessions").isEmpty();
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfUnknownProviderWithoutASessionWhenNoProviderHasTheProviderId() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		String redirectOfNoProvider = redirect.replace("/api/auth/oidc/kc/callback", "/api/auth/oidc/other/callback");

		MvcTestResult callback = callback(mvc, redirectOfNoProvider);

		assertErrorRedirect(callback, "unknown-provider");
		assertThat(sessions()).as("the sessions").isEmpty();
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfIdpErrorWithoutASessionWhenTheIdpAnswersWithAnError() {
		String authorization = locationOf(start(mvc, "kc", newLoginVerifierHash()));
		String redirect = IDP.refuseLogin(authorization, "access_denied");

		MvcTestResult callback = callback(mvc, redirect);

		assertErrorRedirect(callback, "idp-error");
		assertThat(sessions()).as("the sessions").isEmpty();
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfIdpErrorWithoutASessionWhenTheIdpRefusesTheTokenRequest() {
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());
		String code = queryOf(redirect).get("code");
		String redirectWithAnotherCode = redirect.replace("code=" + code, "code=" + UUID.randomUUID());

		MvcTestResult callback = callback(mvc, redirectWithAnotherCode);

		assertErrorRedirect(callback, "idp-error");
		assertThat(sessions()).as("the sessions").isEmpty();
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfIdpErrorWithoutASessionWhenTheIdpGivesNoDiscoveryDocument() {
		String redirect = logInAtTheIdp(mvc, IDP, "stopped", newLoginVerifierHash(), SUBJECT, Map.of());
		IDP.stopServingDiscoveryDocument(STOPPED_ISSUER_URL);
		// Past the life of a kept discovery document, and before the end of the login.
		CLOCK.advance(LIFE_OF_A_KEPT_DISCOVERY_DOCUMENT.plusMinutes(1));

		MvcTestResult callback = callback(mvc, redirect);

		assertErrorRedirect(callback, "idp-error");
		assertThat(sessions()).as("the sessions").isEmpty();
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("wrongIdTokens")
	void callbackRedirectsToTheErrorTargetOfInvalidIdTokenWithoutASessionOrAUserWhenTheIdTokenIsWrong(String wrong,
			IdTokenSignature idTokenSignature, Map<String, ?> claims) {
		IDP.signIdTokens(idTokenSignature);
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, claims);

		MvcTestResult callback = callback(mvc, redirect);

		assertErrorRedirect(callback, "invalid-id-token");
		assertThat(sessions()).as("the sessions").isEmpty();
		assertThat(newUsers()).as("the OpenCelium users other than the default admin").isEmpty();
		assertThat(loginRecords()).as("the login records").isEmpty();
	}

	/** The name of each item of a wrong ID token, the signature of the ID token, and its changed claims. */
	static Stream<Arguments> wrongIdTokens() {
		return Stream.of(
				arguments("a wrong issuer", IdTokenSignature.SERVED_KEY,
						Map.of("iss", "https://other-idp.example.com/realms/oc")),
				arguments("a wrong audience", IdTokenSignature.SERVED_KEY, Map.of("aud", "other-client")),
				arguments("a wrong signature", IdTokenSignature.ANOTHER_KEY_WITH_THE_SERVED_KEY_ID, Map.of()),
				arguments("a wrong nonce", IdTokenSignature.SERVED_KEY, Map.of("nonce", "nonce-of-another-login")),
				arguments("an expired ID token", IdTokenSignature.SERVED_KEY, Map.of("iat",
						START.minus(Duration.ofMinutes(15)), "exp", START.minus(Duration.ofMinutes(10)))));
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfUserLockedWithoutASessionWhenTheOidcLinkGivesALockedOpenCeliumUser() {
		loginCodeOf(callback(mvc, logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of())));
		lock(theOnlyNewUser());
		Document userBefore = theOnlyNewUser();
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, Map.of());

		MvcTestResult callback = callback(mvc, redirect);

		assertErrorRedirect(callback, "user-locked");
		assertThat(sessions()).as("the sessions: only the session of the first login").hasSize(1);
		assertThat(theOnlyNewUser()).as("the locked OpenCelium user of the OIDC link, as before the login")
			.isEqualTo(userBefore);
	}

	@Test
	void callbackRedirectsToTheErrorTargetOfUserLockedWithoutASessionOrAUserWhenTheEmailGivesALockedOpenCeliumUser() {
		String bob = UserFixture.aUser("bob", UUID.randomUUID().toString())
			.withEmail(BOB_EMAIL)
			.locked()
			.storeIn(tenantRunner, documents)
			.id();
		Document bobBefore = userNamed("bob");
		turnOnTheEmailLinkOption(Set.of("kc"));
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, verified(BOB_EMAIL));

		MvcTestResult callback = callback(mvc, redirect);

		assertErrorRedirect(callback, "user-locked");
		assertThat(sessions()).as("the sessions").isEmpty();
		assertThat(newUsers()).as("the OpenCelium users other than the default admin")
			.extracting(OidcCallbackTest::idOf)
			.containsExactly(bob);
		assertThat(userNamed("bob")).as("the locked OpenCelium user with the email, as before the login")
			.isEqualTo(bobBefore);
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("takenEmails")
	void callbackRedirectsToTheErrorTargetOfEmailTakenWithoutASessionOrUserWhenAnotherOpenCeliumUserHasTheVerifiedEmail(
			String taken, String email, Set<String> emailLink) {
		UserFixture.aUser("carol", UUID.randomUUID().toString())
			.withEmail(CAROL_EMAIL)
			.storeIn(tenantRunner, documents);
		List<Document> usersBefore = newUsers();
		turnOnTheEmailLinkOption(emailLink);
		String redirect = logInAtTheIdp(mvc, IDP, "kc", newLoginVerifierHash(), SUBJECT, verified(email));

		MvcTestResult callback = callback(mvc, redirect);

		assertErrorRedirect(callback, "email-taken");
		assertThat(sessions()).as("the sessions").isEmpty();
		assertThat(newUsers()).as("the OpenCelium users other than the default admin, as before the login")
			.isEqualTo(usersBefore);
	}

	/**
	 * The name of each case, the verified email of the ID token of a login through {@code kc}, and the provider IDs
	 * whose email-link option is on. The stored OpenCelium user {@code carol} has the email {@value #CAROL_EMAIL}.
	 */
	static Stream<Arguments> takenEmails() {
		return Stream.of(arguments("the same letters, the email-link option off", CAROL_EMAIL, Set.of()),
				arguments("other upper and lower case letters, the email-link option off", "Carol@Example.COM",
						Set.of()),
				arguments("the email-link option on for another OIDC provider", CAROL_EMAIL, Set.of("kc2")));
	}

	/** The claims of an ID token with the email, which the IdP verified. */
	private static Map<String, Object> verified(String email) {
		return Map.of("email", email, "email_verified", true);
	}

	/**
	 * Saves the OIDC providers again, with the email-link option on for the provider IDs and off for the others. The
	 * save needs a session of the default admin, which the case does not count.
	 */
	private void turnOnTheEmailLinkOption(Set<String> providerIds) {
		saveProviders(mvc, CLIENT_ID, clientSecret, PROVIDERS, providerIds);
		mongo.getCollection("sessions").deleteMany(new Document());
	}

	private void lock(Document user) {
		mongo.getCollection("users")
			.updateOne(new Document("_id", user.get("_id")), new Document("$set", new Document("locked", true)));
	}

	/** The login code, after a check of its signature by core, its issuer and its expiry. */
	private Jwt decoded(String loginCode) {
		return signature.decoder(typeOf(loginCode), ISSUER_OF_CORE).decode(loginCode);
	}

	/** The value of the header {@code typ} of a signed token. */
	private static String typeOf(String token) {
		try {
			JOSEObjectType type = SignedJWT.parse(token).getHeader().getType();
			return type != null ? type.getType() : null;
		}
		catch (ParseException ex) {
			throw new AssertionError("The login code is no signed token.", ex);
		}
	}

	private Document theOnlyNewUser() {
		List<Document> users = newUsers();
		assertThat(users).as("the OpenCelium users other than the default admin").hasSize(1);
		return users.getFirst();
	}

	private static String idOf(Document user) {
		return String.valueOf(user.get("_id"));
	}

	private Document userNamed(String username) {
		Document user = mongo.getCollection("users").find(new Document("username", username)).first();
		assertThat(user).as("the OpenCelium user " + username).isNotNull();
		return user;
	}

	private List<Document> newUsers() {
		return mongo.getCollection("users")
			.find(new Document("username", new Document("$ne", SetupContext.DEFAULT_ADMIN_USERNAME)))
			.into(new ArrayList<>());
	}

	private List<Document> sessions() {
		return mongo.getCollection("sessions").find().into(new ArrayList<>());
	}

	private List<Document> loginRecords() {
		return mongo.getCollection("oidc_logins").find().into(new ArrayList<>());
	}

}
