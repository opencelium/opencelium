package io.opencelium.core.auth;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.bson.Document;
import org.bson.types.Binary;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.testsupport.Bytes;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.SettingsRequests;

import static io.opencelium.core.testsupport.SettingsRequests.field;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * An admin of a self-host installation saves and reads the OIDC providers through the settings API. Each response
 * shows the mask in place of a client secret, and the email-link option is off when a change does not give it. Core
 * refuses an issuer URL without HTTPS, and the mask as a client secret. An OIDC provider without a client secret
 * keeps its stored client secret only with the same provider ID and the same issuer URL. The secrets collection
 * keeps only the client secrets of the saved OIDC providers, and the plaintext of a client secret is in no other
 * place.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class OidcProvidersEndpointTest {

	private static final String KEY = "oidc.providers";

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, OidcProvidersEndpointTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	private final String clientSecret = newClientSecret();

	@BeforeEach
	void removeTheSettingsOfAnotherTest() {
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
	}

	@Test
	void patchMasksTheClientSecretWhenAnAdminSavesAnOidcProvider() {
		MvcTestResult change = save(LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				provider("kc", ISSUER_URL, clientSecret));

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(item(0, "id")).isEqualTo("kc");
		assertThat(change).bodyJson().extractingPath(item(0, "display-name")).isEqualTo("Keycloak kc");
		assertThat(change).bodyJson().extractingPath(item(0, "issuer-url")).isEqualTo(ISSUER_URL);
		assertThat(change).bodyJson().extractingPath(item(0, "client-id")).isEqualTo("core");
		assertThat(change).bodyJson().extractingPath(item(0, "client-secret")).isEqualTo("****");
		assertThat(change).bodyJson().extractingPath(field(KEY, "default")).isEqualTo(false);
		assertThat(change).bodyText().doesNotContain(clientSecret);
	}

	@Test
	void getMasksTheClientSecretWhenAnOidcProviderIsSaved() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret))).as("the save of the OIDC provider")
			.hasStatusOk();
		String secretId = theOnlySecretId();

		MvcTestResult read = SettingsRequests.read(mvc, admin);

		assertThat(read).hasStatusOk();
		assertThat(read).bodyJson().extractingPath(item(0, "id")).isEqualTo("kc");
		assertThat(read).bodyJson().extractingPath(item(0, "client-secret")).isEqualTo("****");
		assertThat(read).bodyText().doesNotContain(clientSecret).doesNotContain(secretId);
	}

	@Test
	void patchTurnsTheEmailLinkOptionOffWhenTheProviderDoesNotGiveIt() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		MvcTestResult change = save(admin, provider("kc", ISSUER_URL, clientSecret));

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(item(0, "email-link")).isEqualTo(false);
		assertThat(SettingsRequests.read(mvc, admin)).bodyJson().extractingPath(item(0, "email-link")).isEqualTo(false);
	}

	@Test
	void patchKeepsTheEmailLinkOptionWhenTheProviderTurnsItOn() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		MvcTestResult change = save(admin, withEmailLinkOn(provider("kc", ISSUER_URL, clientSecret)));

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(item(0, "email-link")).isEqualTo(true);
		assertThat(SettingsRequests.read(mvc, admin)).bodyJson().extractingPath(item(0, "email-link")).isEqualTo(true);
	}

	@Test
	void patchGivesInvalidSettingsWhenTheIssuerUrlHasNoHttps() {
		MvcTestResult change = save(LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				provider("kc", "http://idp.example.com/realms/oc", clientSecret));

		assertInvalidValue(change);
		assertThat(change).bodyText().doesNotContain(clientSecret);
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
		assertThat(mongo.getCollection("secrets").countDocuments()).isZero();
	}

	@Test
	void patchGivesInvalidSettingsWhenTheClientSecretIsTheMask() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret))).as("the save of the OIDC provider")
			.hasStatusOk();
		String secretId = theOnlySecretId();

		MvcTestResult change = save(admin, provider("kc", ISSUER_URL, "****"));

		assertInvalidValue(change);
		assertThat(theOnlySecretId()).as("the kept client secret").isEqualTo(secretId);
		assertThat(storedSecretIdOf("kc")).isEqualTo(secretId);
	}

	@Test
	void patchKeepsTheClientSecretWhenTheProviderHasNoClientSecretAndTheSameIssuerUrl() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret))).as("the save of the OIDC provider")
			.hasStatusOk();
		String secretId = theOnlySecretId();

		MvcTestResult change = save(admin, provider("kc", "Keycloak of the staff", ISSUER_URL, null));

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(item(0, "display-name")).isEqualTo("Keycloak of the staff");
		assertThat(change).bodyJson().extractingPath(item(0, "client-secret")).isEqualTo("****");
		assertThat(theOnlySecretId()).as("the kept client secret").isEqualTo(secretId);
		assertThat(storedSecretIdOf("kc")).isEqualTo(secretId);
	}

	@Test
	void patchGivesInvalidSettingsWhenTheIssuerUrlChangesWithoutAClientSecret() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret))).as("the save of the OIDC provider")
			.hasStatusOk();
		String secretId = theOnlySecretId();

		MvcTestResult change = save(admin, provider("kc", "https://other-idp.example.com/realms/oc", null));

		assertInvalidValue(change);
		assertThat(SettingsRequests.read(mvc, admin)).bodyJson().extractingPath(item(0, "issuer-url"))
			.isEqualTo(ISSUER_URL);
		assertThat(theOnlySecretId()).as("the kept client secret").isEqualTo(secretId);
	}

	@Test
	void patchGivesInvalidSettingsWhenANewProviderHasNoClientSecret() {
		MvcTestResult change = save(LoginRequests.sessionJwtOfTheDefaultAdmin(mvc), provider("kc", ISSUER_URL, null));

		assertInvalidValue(change);
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
	}

	@Test
	void patchDeletesTheReplacedClientSecretWhenTheProviderGivesANewOne() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret))).as("the save of the OIDC provider")
			.hasStatusOk();
		String replacedId = theOnlySecretId();

		MvcTestResult change = save(admin, provider("kc", ISSUER_URL, newClientSecret()));

		assertThat(change).hasStatusOk();
		String newId = theOnlySecretId();
		assertThat(newId).isNotEqualTo(replacedId);
		assertThat(storedSecretIdOf("kc")).isEqualTo(newId);
	}

	@Test
	void patchDeletesTheClientSecretOfAProviderWhenTheChangeRemovesIt() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret),
				provider("kc2", "https://login.example.org/tenant-2/v2.0", newClientSecret())))
			.as("the save of 2 OIDC providers")
			.hasStatusOk();
		String keptId = storedSecretIdOf("kc");

		MvcTestResult change = save(admin, provider("kc", ISSUER_URL, null));

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(field(KEY, "value")).asArray().hasSize(1);
		assertThat(change).bodyJson().extractingPath(item(0, "id")).isEqualTo("kc");
		assertThat(theOnlySecretId()).as("the client secret of the kept OIDC provider").isEqualTo(keptId);
	}

	@Test
	void patchDeletesEachClientSecretWhenTheSettingIsReset() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret),
				provider("kc2", "https://login.example.org/tenant-2/v2.0", newClientSecret())))
			.as("the save of 2 OIDC providers")
			.hasStatusOk();

		MvcTestResult reset = SettingsRequests.change(mvc, admin, "{\"" + KEY + "\": null}");

		assertThat(reset).hasStatusOk();
		assertThat(reset).bodyJson().extractingPath(field(KEY, "value")).asArray().isEmpty();
		assertThat(reset).bodyJson().extractingPath(field(KEY, "default")).isEqualTo(true);
		assertThat(mongo.getCollection("secrets").countDocuments()).isZero();
	}

	@Test
	void patchDeletesEachClientSecretWhenTheChangeHasNoProvider() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(save(admin, provider("kc", ISSUER_URL, clientSecret),
				provider("kc2", "https://login.example.org/tenant-2/v2.0", newClientSecret())))
			.as("the save of 2 OIDC providers")
			.hasStatusOk();

		MvcTestResult change = save(admin);

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(field(KEY, "value")).asArray().isEmpty();
		assertThat(mongo.getCollection("secrets").countDocuments()).isZero();
	}

	@Test
	void patchKeepsTheClientSecretOnlyAsASecretOfTheInstallationWhenAnAdminSavesAnOidcProvider(
			CapturedOutput output) {
		MvcTestResult change = save(LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				provider("kc", ISSUER_URL, clientSecret));

		assertThat(change).hasStatusOk();
		String secretId = theOnlySecretId();
		assertThat(storedProviders()).singleElement()
			.satisfies(provider -> assertThat(provider.get("client-secret", Document.class))
				.isEqualTo(new Document("owner", "system").append("id", secretId)));
		for (String collection : mongo.getCollectionNames()) {
			for (Document document : mongo.getCollection(collection).find()) {
				assertNoClientSecret(document, collection);
			}
		}
		assertThat(output.getAll()).doesNotContain(clientSecret);
	}

	/** A change of the OIDC providers with the JSON objects of the providers, as the HTTP client sends it. */
	private MvcTestResult save(String sessionJwt, String... providers) {
		return SettingsRequests.change(mvc, sessionJwt, "{\"" + KEY + "\": [" + String.join(", ", providers) + "]}");
	}

	/** The JSON object of an OIDC provider without the email-link option; without a client secret when it is null. */
	private static String provider(String id, String issuerUrl, String clientSecret) {
		return provider(id, "Keycloak " + id, issuerUrl, clientSecret);
	}

	private static String provider(String id, String displayName, String issuerUrl, String clientSecret) {
		String json = "{\"id\": \"" + id + "\", \"display-name\": \"" + displayName + "\", \"issuer-url\": \""
				+ issuerUrl + "\", \"client-id\": \"core\"";
		return clientSecret == null ? json + "}" : json + ", \"client-secret\": \"" + clientSecret + "\"}";
	}

	private static String withEmailLinkOn(String provider) {
		return provider.substring(0, provider.length() - 1) + ", \"email-link\": true}";
	}

	/** A new random client secret, so that the plaintext of each case is unique and fixed nowhere in the code. */
	private static String newClientSecret() {
		return UUID.randomUUID().toString();
	}

	/** The JSON path of a field of an OIDC provider in a response of the settings API. */
	private static String item(int index, String field) {
		return field(KEY, "value[" + index + "]['" + field + "']");
	}

	private static void assertInvalidValue(MvcTestResult change) {
		LoginRequests.assertProblem(change, HttpStatus.BAD_REQUEST, "invalid-settings");
		assertThat(change).bodyJson().extractingPath("$.errors[0].key").isEqualTo(KEY);
		assertThat(change).bodyJson().extractingPath("$.errors[0].problem").isEqualTo("invalid-value");
	}

	/** The ID of the 1 secret of the secrets collection; the assertion fails when the collection has another number. */
	private String theOnlySecretId() {
		assertThat(mongo.getCollection("secrets").countDocuments()).as("the number of secrets").isOne();
		return mongo.getCollection("secrets").find().first().getString("_id");
	}

	/** The OIDC providers in the settings document, in the field of the setting key. */
	private List<Document> storedProviders() {
		Document installation = mongo.getCollection("settings").find(new Document("_id", "installation")).first();
		assertThat(installation).as("the settings document").isNotNull();
		Document oidc = installation.get("oidc", Document.class);
		assertThat(oidc).as("the field of the setting key").isNotNull();
		return oidc.getList("providers", Document.class);
	}

	/** The secret ID of the secret reference of the stored OIDC provider with the provider ID. */
	private String storedSecretIdOf(String providerId) {
		return storedProviders().stream()
			.filter(provider -> providerId.equals(provider.getString("id")))
			.findFirst()
			.orElseThrow()
			.get("client-secret", Document.class)
			.getString("id");
	}

	/** Each value of the document, also inside a subdocument, a list or as bytes, does not hold the client secret. */
	private void assertNoClientSecret(Object value, String place) {
		if (value instanceof Document document) {
			document.forEach((key, field) -> assertNoClientSecret(field, place + "." + key));
		}
		else if (value instanceof List<?> list) {
			list.forEach(item -> assertNoClientSecret(item, place));
		}
		else if (value instanceof String text) {
			assertThat(text).as(place).doesNotContain(clientSecret);
		}
		else if (value instanceof Binary binary) {
			assertThat(Bytes.contains(binary.getData(), clientSecret.getBytes(StandardCharsets.UTF_8))).as(place)
				.isFalse();
		}
	}

}
