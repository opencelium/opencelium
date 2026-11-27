package io.opencelium.core.auth;

import java.net.URI;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexField;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.MutableClock;
import io.opencelium.core.testsupport.SettingsRequests;
import io.opencelium.core.testsupport.fake.FakeIdp;
import io.opencelium.core.testsupport.fixture.TokenFixture;

import static io.opencelium.core.testsupport.OidcLoginRequests.LOGIN_PATH;
import static io.opencelium.core.testsupport.OidcLoginRequests.LOGIN_VERIFIER_HASH;
import static io.opencelium.core.testsupport.OidcLoginRequests.assertErrorRedirect;
import static io.opencelium.core.testsupport.OidcLoginRequests.locationOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifierHash;
import static io.opencelium.core.testsupport.OidcLoginRequests.queryOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.s256;
import static io.opencelium.core.testsupport.OidcLoginRequests.start;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * In the self-host mode the browser starts the login of an OIDC provider without a session JWT, with the hash of its
 * login verifier, and core redirects it to the login page of the IdP: the authorization endpoint of the discovery
 * document, with the authorization code flow, the client ID, the redirect URI of the provider, the scope
 * {@code openid}, a state, a nonce and a PKCE code challenge with the method S256. The redirect URI has the scheme,
 * the host and the port of the request, without the default port of the scheme; a forwarded header changes it only
 * when the Spring property of the forwarded headers permits it, and no test sets that property.
 * <p>
 * Each start keeps 1 login record in the collection {@code oidc_logins}, a document of the tenant
 * {@code self-host-tenant}: the provider ID, the state, the nonce, the PKCE verifier, the hash of the login verifier,
 * and its end 10 minutes after the start. A TTL index deletes the record at its end. The record and the redirect hold
 * no client secret. A start that core refuses keeps no login record.
 * <p>
 * Core keeps the discovery document of an issuer URL for 5 minutes. A case that counts the reads of a discovery
 * document, or that removes one, has an issuer URL of its own, so that a document that core keeps from another case
 * does not change its result. The clock of core starts at the real time: MongoDB deletes a login record at its end by
 * the real time, and a record with an end in the past could disappear during a test.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class OidcLoginStartTest {

	private static final String COLLECTION = "oidc_logins";

	private static final String KEY = "oidc.providers";

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	/** The issuer URL of the case that counts the reads of its discovery document. */
	private static final String KEPT_ISSUER_URL = "https://kept-idp.example.com/realms/oc";

	/** The issuer URL of the case whose IdP stops serving its discovery document. */
	private static final String STOPPED_ISSUER_URL = "https://stopped-idp.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final Duration LIFE_OF_A_LOGIN_RECORD = Duration.ofMinutes(10);

	private static final Duration LIFE_OF_A_KEPT_DISCOVERY_DOCUMENT = Duration.ofMinutes(5);

	/** The characters and the length of a PKCE verifier (RFC 7636, section 4.1). */
	private static final String PKCE_VERIFIER = "[A-Za-z0-9._~-]{43,128}";

	private static final String ATTACKER_HOST = "attacker.example.com";

	private static final Instant START = Instant.now().truncatedTo(ChronoUnit.MILLIS);

	private static final MutableClock CLOCK = new MutableClock(START);

	private static final FakeIdp IDP = new FakeIdp();

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, OidcLoginStartTest.class, () -> dataDir);
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

	@BeforeEach
	void resetTheClock() {
		CLOCK.set(START);
	}

	@BeforeEach
	void removeTheDataOfAnotherTest() {
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
		mongo.getCollection(COLLECTION).deleteMany(new Document());
	}

	@BeforeEach
	void serveTheDiscoveryDocumentOfEachIssuerUrl() {
		IDP.reset();
		serveTheDiscoveryDocuments();
	}

	@Test
	void loginRedirectsTheBrowserToTheLoginPageOfTheIdpWhenTheProviderExists() {
		saveTheProvider("kc", ISSUER_URL);

		MvcTestResult start = start(mvc, "kc", newLoginVerifierHash());

		URI target = URI.create(locationOf(start));
		assertThat(target).hasScheme("https").hasHost("idp.example.com")
			.hasPath("/realms/oc" + FakeIdp.AUTHORIZATION_PATH);
		Map<String, String> query = queryOf(target.toString());
		assertThat(query).containsEntry("response_type", "code")
			.containsEntry("client_id", CLIENT_ID)
			.containsEntry("redirect_uri", "http://localhost/api/auth/oidc/kc/callback")
			.containsEntry("code_challenge_method", "S256");
		assertThat(query.get("scope")).as("the scope").isNotNull();
		assertThat(query.get("scope").split(" ")).contains("openid");
		assertThat(query.get("state")).as("the state").isNotBlank();
		assertThat(query.get("nonce")).as("the nonce").isNotBlank();
		assertThat(query.get("code_challenge")).as("the code challenge").isNotBlank();
	}

	@Test
	void loginKeepsALoginRecordWithTheStateTheNonceAndThePkceVerifierOfTheRedirectWhenItRedirectsTheBrowser() {
		saveTheProvider("kc", ISSUER_URL);
		String loginVerifierHash = newLoginVerifierHash();

		Map<String, String> query = queryOf(locationOf(start(mvc, "kc", loginVerifierHash)));

		List<Document> records = loginRecords();
		assertThat(records).as("the login records").hasSize(1);
		Document record = records.getFirst();
		assertThat(record.getString("tenantId")).isEqualTo("self-host-tenant");
		assertThat(record.getString("providerId")).isEqualTo("kc");
		assertThat(record.getString("state")).isEqualTo(query.get("state"));
		assertThat(record.getString("nonce")).isEqualTo(query.get("nonce"));
		assertThat(record.getString("loginVerifierHash")).isEqualTo(loginVerifierHash);
		String codeVerifier = record.getString("codeVerifier");
		assertThat(codeVerifier).as("the PKCE verifier").matches(PKCE_VERIFIER);
		assertThat(query.get("code_challenge")).as("the S256 code challenge of the PKCE verifier")
			.isEqualTo(s256(codeVerifier));
	}

	@Test
	void loginGivesTheLoginRecordAnEndTenMinutesAfterTheStartWhenItKeepsTheRecord() {
		saveTheProvider("kc", ISSUER_URL);

		locationOf(start(mvc, "kc", newLoginVerifierHash()));

		List<Document> records = loginRecords();
		assertThat(records).as("the login records").hasSize(1);
		assertThat(records.getFirst().getDate("expiresAt")).as("the end of the login record").isNotNull();
		assertThat(records.getFirst().getDate("expiresAt").toInstant()).isEqualTo(START.plus(LIFE_OF_A_LOGIN_RECORD));
	}

	@Test
	void indexesHaveATtlIndexOnTheEndOfTheLoginRecordWhenCoreStarts() {
		IndexInfo index = mongo.indexOps(COLLECTION).getIndexInfo().stream()
			.filter(info -> info.getIndexFields().stream().map(IndexField::getKey).toList().equals(List.of("expiresAt")))
			.findFirst()
			.orElse(null);

		assertThat(index).as("the index on the end of the login record").isNotNull();
		assertThat(index.getExpireAfter()).contains(Duration.ZERO);
	}

	@Test
	void loginGivesEachLoginItsOwnStateNonceAndPkceVerifierWhenTheBrowserStartsTwoLogins() {
		saveTheProvider("kc", ISSUER_URL);

		Map<String, String> first = queryOf(locationOf(start(mvc, "kc", newLoginVerifierHash())));
		Map<String, String> second = queryOf(locationOf(start(mvc, "kc", newLoginVerifierHash())));

		assertThat(second.get("state")).as("the state of the second login").isNotEqualTo(first.get("state"));
		assertThat(second.get("nonce")).as("the nonce of the second login").isNotEqualTo(first.get("nonce"));
		assertThat(second.get("code_challenge")).as("the code challenge of the second login")
			.isNotEqualTo(first.get("code_challenge"));
		List<Document> records = loginRecords();
		assertThat(records).as("1 login record for each login").hasSize(2);
		assertThat(records).extracting(record -> record.getString("codeVerifier")).doesNotHaveDuplicates();
		assertThat(records).extracting(record -> record.getString("state"))
			.containsExactlyInAnyOrder(first.get("state"), second.get("state"));
	}

	@Test
	void loginKeepsTheClientSecretOutOfTheRedirectAndTheLoginRecordWhenItRedirectsTheBrowser() {
		saveTheProvider("kc", ISSUER_URL);

		String location = locationOf(start(mvc, "kc", newLoginVerifierHash()));

		assertThat(location).doesNotContain(clientSecret);
		assertThat(queryOf(location)).doesNotContainKey("client_secret");
		List<Document> records = loginRecords();
		assertThat(records).as("the login records").hasSize(1);
		Document record = records.getFirst();
		assertThat(record.toJson()).doesNotContain(clientSecret);
		assertThat(record.keySet()).as("the fields of the login record").doesNotContain("code")
			.noneMatch(field -> field.toLowerCase(Locale.ROOT).contains("secret"))
			.noneMatch(field -> field.toLowerCase(Locale.ROOT).contains("token"));
	}

	@Test
	void loginRedirectsTheBrowserToTheIdpWhenTheRequestCarriesAnInvalidBearerToken() {
		saveTheProvider("kc", ISSUER_URL);
		String invalid = TokenFixture.resignedWithANewKey(LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));

		MvcTestResult start = mvc.get().uri(LOGIN_PATH, "kc").param(LOGIN_VERIFIER_HASH, newLoginVerifierHash())
			.header(HttpHeaders.AUTHORIZATION, "Bearer " + invalid)
			.exchange();

		assertThat(locationOf(start)).startsWith(ISSUER_URL + FakeIdp.AUTHORIZATION_PATH + "?");
		assertThat(loginRecords()).as("the login records").hasSize(1);
	}

	@Test
	void loginGivesTheIdpTheRedirectUriOfTheSchemeAndTheHostOfTheRequestWhenTheRequestReachesCoreOverHttps() {
		saveTheProvider("kc", ISSUER_URL);

		// MockMvc takes the port only from the URI: without it the request has the port 80.
		MvcTestResult start = mvc.get().uri("https://oc.example.com:443/api/auth/oidc/kc/login")
			.param(LOGIN_VERIFIER_HASH, newLoginVerifierHash())
			.exchange();

		assertThat(queryOf(locationOf(start))).containsEntry("redirect_uri",
				"https://oc.example.com/api/auth/oidc/kc/callback");
	}

	@Test
	void loginKeepsThePortOfTheRequestInTheRedirectUriWhenCoreRunsOnAnotherPort() {
		saveTheProvider("kc", ISSUER_URL);

		MvcTestResult start = mvc.get().uri("http://localhost:9090/api/auth/oidc/kc/login")
			.param(LOGIN_VERIFIER_HASH, newLoginVerifierHash())
			.exchange();

		assertThat(queryOf(locationOf(start))).containsEntry("redirect_uri",
				"http://localhost:9090/api/auth/oidc/kc/callback");
	}

	@Test
	void loginKeepsTheHostOfTheRequestInTheRedirectUriWhenTheRequestHasForwardedHeadersThatNoPropertyPermits() {
		saveTheProvider("kc", ISSUER_URL);

		MvcTestResult start = mvc.get().uri(LOGIN_PATH, "kc").param(LOGIN_VERIFIER_HASH, newLoginVerifierHash())
			.header("Forwarded", "proto=https;host=" + ATTACKER_HOST)
			.header("X-Forwarded-Host", ATTACKER_HOST)
			.header("X-Forwarded-Proto", "https")
			.header("X-Forwarded-Port", "8443")
			.exchange();

		assertThat(queryOf(locationOf(start))).containsEntry("redirect_uri",
				"http://localhost/api/auth/oidc/kc/callback");
	}

	@Test
	void loginReadsTheDiscoveryDocumentAgainOnlyWhenTheKeptDocumentIsOlderThanFiveMinutes() {
		saveTheProvider("kept", KEPT_ISSUER_URL);
		URI discoveryUrl = URI.create(FakeIdp.discoveryUrlOf(KEPT_ISSUER_URL));
		locationOf(start(mvc, "kept", newLoginVerifierHash()));
		long readsAfterTheFirstStart = readsOf(discoveryUrl);

		CLOCK.advance(LIFE_OF_A_KEPT_DISCOVERY_DOCUMENT.minusMinutes(1));
		locationOf(start(mvc, "kept", newLoginVerifierHash()));
		assertThat(readsOf(discoveryUrl)).as("the reads of the discovery document 4 minutes after the first start")
			.isEqualTo(readsAfterTheFirstStart);

		CLOCK.advance(Duration.ofMinutes(1).plusSeconds(1));
		locationOf(start(mvc, "kept", newLoginVerifierHash()));
		assertThat(readsOf(discoveryUrl)).as("the reads of the discovery document 5 minutes after the first start")
			.isEqualTo(readsAfterTheFirstStart + 1);
	}

	@Test
	void loginRedirectsToTheErrorTargetOfUnknownProviderWithoutALoginRecordWhenNoProviderHasTheProviderId() {
		saveTheProvider("kc", ISSUER_URL);
		forgetTheRequestsToTheIdp();

		MvcTestResult start = start(mvc, "other", newLoginVerifierHash());

		assertErrorRedirect(start, "unknown-provider");
		assertThat(loginRecords()).as("the login records").isEmpty();
		assertThat(IDP.requests()).as("the requests to an IdP").isEmpty();
	}

	@Test
	void loginRedirectsToTheErrorTargetOfBadRequestWithoutALoginRecordWhenTheRequestHasNoHash() {
		saveTheProvider("kc", ISSUER_URL);

		MvcTestResult start = mvc.get().uri(LOGIN_PATH, "kc").exchange();

		assertErrorRedirect(start, "bad-request");
		assertThat(loginRecords()).as("the login records").isEmpty();
	}

	@Test
	void loginRedirectsToTheErrorTargetOfBadRequestWithoutALoginRecordWhenTheHashIsNotABase64UrlSha256() {
		saveTheProvider("kc", ISSUER_URL);

		MvcTestResult start = start(mvc, "kc", "not-a-hash");

		assertErrorRedirect(start, "bad-request");
		assertThat(loginRecords()).as("the login records").isEmpty();
	}

	@Test
	void loginRedirectsToTheErrorTargetOfIdpErrorWithoutALoginRecordWhenTheIdpStopsServingItsDiscoveryDocument() {
		saveTheProvider("stopped", STOPPED_ISSUER_URL);
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
		// Past the life of a discovery document that core kept at the save, so that the start reads the document.
		CLOCK.advance(LIFE_OF_A_KEPT_DISCOVERY_DOCUMENT.plusMinutes(1));

		MvcTestResult start = start(mvc, "stopped", newLoginVerifierHash());

		assertErrorRedirect(start, "idp-error");
		assertThat(loginRecords()).as("the login records").isEmpty();
	}

	private static void serveTheDiscoveryDocuments() {
		IDP.serveDiscoveryDocument(ISSUER_URL);
		IDP.serveDiscoveryDocument(KEPT_ISSUER_URL);
		IDP.serveDiscoveryDocument(STOPPED_ISSUER_URL);
	}

	/** Removes the record of each request to the IdP, for example the read of the discovery document at a save. */
	private static void forgetTheRequestsToTheIdp() {
		IDP.reset();
		serveTheDiscoveryDocuments();
	}

	private static long readsOf(URI address) {
		return IDP.requests().stream().filter(address::equals).count();
	}

	private List<Document> loginRecords() {
		return mongo.getCollection(COLLECTION).find().into(new ArrayList<>());
	}

	/** Saves 1 OIDC provider through the settings API as the default admin; it replaces each other OIDC provider. */
	private void saveTheProvider(String id, String issuerUrl) {
		String provider = "{\"id\": \"" + id + "\", \"display-name\": \"Keycloak\", \"issuer-url\": \"" + issuerUrl
				+ "\", \"client-id\": \"" + CLIENT_ID + "\", \"client-secret\": \"" + clientSecret + "\"}";
		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				"{\"" + KEY + "\": [" + provider + "]}");
		assertThat(change).as("the save of the OIDC provider").hasStatusOk();
	}

}
