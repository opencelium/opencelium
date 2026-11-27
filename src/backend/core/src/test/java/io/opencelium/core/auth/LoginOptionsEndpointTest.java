package io.opencelium.core.auth;

import java.nio.file.Path;
import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.SettingsRequests;
import io.opencelium.core.testsupport.fake.FakeIdp;
import io.opencelium.core.testsupport.fixture.TokenFixture;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * In the self-host mode the login page gets the OIDC providers as login options without a session JWT: a JSON array
 * with the fields {@code id} and {@code displayName} of each OIDC provider, in the order of the setting, and no other
 * field. An old session JWT in the header of the HTTP client does not stop the request, and the request calls no IdP.
 * The OIDC providers come from the settings API, where the fake IdP serves the discovery document of each issuer
 * URL.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class LoginOptionsEndpointTest {

	private static final String PATH = "/api/auth/oidc/providers";

	private static final String KEY = "oidc.providers";

	private static final String STAFF_ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String PARTNER_ISSUER_URL = "https://login.example.org/tenant-2/v2.0";

	/** The login options with only the OIDC provider {@code kc}. */
	private static final String ONLY_THE_STAFF_PROVIDER = "[{\"id\": \"kc\","
			+ " \"displayName\": \"Keycloak of the staff\"}]";

	private static final FakeIdp IDP = new FakeIdp();

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, LoginOptionsEndpointTest.class, () -> dataDir);
	}

	@TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
	ClientHttpRequestFactory oidcRequestFactory;

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	static ClientHttpRequestFactory fakeIdp() {
		return IDP;
	}

	@BeforeEach
	void removeTheSettingsOfAnotherTest() {
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
	}

	@BeforeEach
	void serveTheDiscoveryDocumentOfEachIssuerUrl() {
		IDP.reset();
		IDP.serveDiscoveryDocument(STAFF_ISSUER_URL);
		IDP.serveDiscoveryDocument(PARTNER_ISSUER_URL);
	}

	@Test
	void providersListsTheProviderIdAndTheDisplayNameOfEachProviderWhenTheRequestHasNoSessionJwt() {
		String clientSecret = newClientSecret();
		saveTheProviders(provider("kc", "Keycloak of the staff", STAFF_ISSUER_URL, clientSecret),
				provider("kc2", "Entra ID of the partners", PARTNER_ISSUER_URL, newClientSecret()));

		MvcTestResult options = mvc.get().uri(PATH).exchange();

		assertThat(options).hasStatusOk().hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON);
		assertThat(options).bodyJson()
			.isStrictlyEqualTo("[{\"id\": \"kc\", \"displayName\": \"Keycloak of the staff\"},"
					+ " {\"id\": \"kc2\", \"displayName\": \"Entra ID of the partners\"}]");
		assertThat(options).bodyText().doesNotContain(clientSecret);
	}

	@Test
	void providersListsTheProvidersWhenTheRequestCarriesAnInvalidBearerToken() {
		saveTheProviders(provider("kc", "Keycloak of the staff", STAFF_ISSUER_URL, newClientSecret()));
		String invalid = TokenFixture.resignedWithANewKey(LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));

		MvcTestResult options = mvc.get().uri(PATH).header(HttpHeaders.AUTHORIZATION, "Bearer " + invalid).exchange();

		assertThat(options).hasStatusOk();
		assertThat(options).bodyJson().isStrictlyEqualTo(ONLY_THE_STAFF_PROVIDER);
	}

	@Test
	void providersMakesNoRequestToAnIdpWhenItListsTheProviders() {
		saveTheProviders(provider("kc", "Keycloak of the staff", STAFF_ISSUER_URL, newClientSecret()));
		IDP.reset();

		MvcTestResult options = mvc.get().uri(PATH).exchange();

		assertThat(options).hasStatusOk();
		assertThat(options).bodyJson().isStrictlyEqualTo(ONLY_THE_STAFF_PROVIDER);
		assertThat(IDP.requests()).isEmpty();
	}

	@Test
	void providersGivesAnEmptyListWhenNoProviderIsSaved() {
		MvcTestResult options = mvc.get().uri(PATH).exchange();

		assertThat(options).hasStatusOk().hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON);
		assertThat(options).bodyJson().isStrictlyEqualTo("[]");
	}

	@Test
	void providersListsTheCurrentProvidersWhenAnAdminChangesThem() {
		saveTheProviders(provider("kc", "Keycloak of the staff", STAFF_ISSUER_URL, newClientSecret()));
		MvcTestResult before = mvc.get().uri(PATH).exchange();
		assertThat(before).as("the login options before the change").hasStatusOk();
		assertThat(before).bodyJson().isStrictlyEqualTo(ONLY_THE_STAFF_PROVIDER);

		saveTheProviders(provider("kc2", "Entra ID of the partners", PARTNER_ISSUER_URL, newClientSecret()));
		MvcTestResult options = mvc.get().uri(PATH).exchange();

		assertThat(options).hasStatusOk();
		assertThat(options).bodyJson()
			.isStrictlyEqualTo("[{\"id\": \"kc2\", \"displayName\": \"Entra ID of the partners\"}]");
	}

	/** Saves the OIDC providers through the settings API as the default admin. */
	private void saveTheProviders(String... providers) {
		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				"{\"" + KEY + "\": [" + String.join(", ", providers) + "]}");
		assertThat(change).as("the save of the OIDC providers").hasStatusOk();
	}

	/** The JSON object of an OIDC provider of a change; the values must need no JSON escape. */
	private static String provider(String id, String displayName, String issuerUrl, String clientSecret) {
		return "{\"id\": \"" + id + "\", \"display-name\": \"" + displayName + "\", \"issuer-url\": \"" + issuerUrl
				+ "\", \"client-id\": \"core\", \"client-secret\": \"" + clientSecret + "\"}";
	}

	/** A new random client secret, so that the plaintext of each case is unique and fixed nowhere in the code. */
	private static String newClientSecret() {
		return UUID.randomUUID().toString();
	}

}
