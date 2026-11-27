package io.opencelium.core.auth;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.settings.SettingDefinition;
import io.opencelium.core.settings.SettingRule;
import io.opencelium.core.testsupport.CloudStart;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.OidcLoginRequests;
import io.opencelium.core.testsupport.fake.FakeIdp;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * In the cloud mode the installation has no OIDC login strategy: the setting of the OIDC providers of the running
 * application refuses each OIDC provider, also a valid one of the self-host mode, with the problem
 * {@code invalid-value} and without a request to its IdP. Thus a change refuses it even when a later rule lets a user
 * change an installation setting in the cloud mode. That no OpenCelium user changes an installation setting in the
 * cloud mode today is the subject of the settings cloud test.
 * <p>
 * The endpoint of the login options is open in the cloud mode too, and its list holds no OIDC provider, also when
 * the settings document holds one.
 * <p>
 * The start of an OIDC login is open in the cloud mode too, and it knows no OIDC provider, also when the settings
 * document holds one: it redirects the browser to the login page of the frontend with the error code
 * {@code unknown-provider}, without a request to the IdP.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class OidcCloudTest {

	private static final String LOGIN_OPTIONS_PATH = "/api/auth/oidc/providers";

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final FakeIdp IDP = new FakeIdp();

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		CloudStart.register(registry, OidcCloudTest.class, () -> dataDir);
	}

	@TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
	ClientHttpRequestFactory oidcRequestFactory;

	@Autowired
	List<SettingDefinition> definitions;

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
	}

	@BeforeEach
	void serveTheDiscoveryDocumentOfTheIssuerUrl() {
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
	}

	@Test
	void validateRefusesAnOidcProviderWhenTheModeIsCloud() {
		assertThat(theRuleOfTheOidcProviders().validate(List.of(validProvider()))).isFalse();
	}

	@Test
	void problemOfGivesInvalidValueWithoutARequestToTheIdpWhenTheModeIsCloud() {
		assertThat(theRuleOfTheOidcProviders().problemOf(List.of(validProvider()), null)).contains("invalid-value");
		assertThat(IDP.requests()).isEmpty();
	}

	@Test
	void providersAnswersWithoutASessionJwtWhenTheModeIsCloud() {
		MvcTestResult options = mvc.get().uri(LOGIN_OPTIONS_PATH).exchange();

		assertThat(options).hasStatusOk().hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON);
		assertThat(options).bodyJson().isStrictlyEqualTo("[]");
	}

	@Test
	void providersGivesAnEmptyListWhenTheSettingsDocumentHoldsAProviderAndTheModeIsCloud() {
		storeTheProviderInTheSettingsDocument();

		MvcTestResult options = mvc.get().uri(LOGIN_OPTIONS_PATH).exchange();

		assertThat(options).hasStatusOk();
		assertThat(options).bodyJson().isStrictlyEqualTo("[]");
	}

	@Test
	void loginRedirectsToTheErrorTargetOfUnknownProviderWithoutARequestToTheIdpWhenTheModeIsCloud() {
		storeTheProviderInTheSettingsDocument();

		MvcTestResult start = OidcLoginRequests.start(mvc, "kc", OidcLoginRequests.newLoginVerifierHash());

		OidcLoginRequests.assertErrorRedirect(start, "unknown-provider");
		assertThat(IDP.requests()).as("the requests to an IdP").isEmpty();
	}

	/**
	 * Stores the OIDC provider {@code kc} in the settings document. The cloud mode refuses each change of the OIDC
	 * providers, so the provider goes into the database directly.
	 */
	private void storeTheProviderInTheSettingsDocument() {
		Document provider = new Document("id", "kc").append("display-name", "Keycloak")
			.append("issuer-url", ISSUER_URL)
			.append("client-id", "core")
			.append("client-secret", new Document("owner", "system").append("id", UUID.randomUUID().toString()))
			.append("email-link", false);
		mongo.getCollection("settings")
			.insertOne(new Document("_id", "installation").append("oidc",
					new Document("providers", List.of(provider))));
	}

	private SettingDefinition theOidcProviders() {
		return definitions.stream()
			.filter(definition -> definition.key().equals("oidc.providers"))
			.findFirst()
			.orElseThrow();
	}

	private SettingRule theRuleOfTheOidcProviders() {
		SettingDefinition providers = theOidcProviders();
		assertThat(providers.rule()).as("the rule of the OIDC providers").isNotNull();
		return providers.rule();
	}

	/** An OIDC provider that the self-host mode accepts, with a new random client secret. */
	private static Map<String, Object> validProvider() {
		Map<String, Object> provider = new LinkedHashMap<>();
		provider.put("id", "kc");
		provider.put("display-name", "Keycloak");
		provider.put("issuer-url", ISSUER_URL);
		provider.put("client-id", "core");
		provider.put("client-secret", UUID.randomUUID().toString());
		provider.put("email-link", false);
		return provider;
	}

}
