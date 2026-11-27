package io.opencelium.core.user;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.convention.TestBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.fake.FakeIdp;
import io.opencelium.core.testsupport.fixture.UserFixture;

import static io.opencelium.core.testsupport.OidcLoginRequests.callback;
import static io.opencelium.core.testsupport.OidcLoginRequests.logInAtTheIdp;
import static io.opencelium.core.testsupport.OidcLoginRequests.loginCodeOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifierHash;
import static io.opencelium.core.testsupport.OidcLoginRequests.saveProviders;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * After a correct answer of the IdP core finds the OpenCelium user of the ID token by its OIDC link, the pair of the
 * issuer and the subject. Without an OpenCelium user with that OIDC link, core makes a new OpenCelium user with the
 * OIDC link, without a role and without a password. Its username is the provider ID, a hyphen and the subject when
 * the ID token has no verified email, with a hyphen and a number when an OpenCelium user has that username. A unique
 * index refuses a second OpenCelium user with the OIDC link of another one, and it does not refuse OpenCelium users
 * without an OIDC link.
 * <p>
 * Each login goes through the endpoints of core and the fake IdP: the session of a login names its OpenCelium user.
 * The tests find an OIDC link by its values, not by the names of its fields: an embedded document, alone or in a list,
 * with the issuer URL and the subject. The ID tokens of these tests have no email, so the email-link option and the
 * email of a new OpenCelium user do not apply.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class OidcUserLookupTest {

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String OTHER_ISSUER_URL = "https://idp2.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final String ADMIN = SetupContext.DEFAULT_ADMIN_USERNAME;

	private static final FakeIdp IDP = new FakeIdp();

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, OidcUserLookupTest.class, () -> dataDir);
	}

	@TestBean(name = FakeIdp.BEAN_NAME, methodName = "fakeIdp")
	ClientHttpRequestFactory oidcRequestFactory;

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	TenantDocuments documents;

	private final String clientSecret = UUID.randomUUID().toString();

	static ClientHttpRequestFactory fakeIdp() {
		return IDP;
	}

	/**
	 * Each case starts with the OIDC providers {@code kc} and {@code kc2} of 2 issuer URLs, the default admin as the
	 * only OpenCelium user, and no session: the save of the OIDC providers needs a session of the default admin.
	 */
	@BeforeEach
	void saveTheProvidersWithoutASessionOrAnotherUser() {
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
		mongo.getCollection("oidc_logins").deleteMany(new Document());
		mongo.remove(new Query(where("username").ne(ADMIN)), "users");
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
		IDP.serveDiscoveryDocument(OTHER_ISSUER_URL);
		IDP.registerClient(CLIENT_ID, clientSecret);
		saveProviders(mvc, CLIENT_ID, clientSecret, Map.of("kc", ISSUER_URL, "kc2", OTHER_ISSUER_URL));
		mongo.getCollection("sessions").deleteMany(new Document());
	}

	@Test
	void callbackMakesAnOpenCeliumUserWithTheOidcLinkOfTheIssuerAndTheSubjectWhenNoUserHasTheLink() {
		String subject = newSubject();

		logIn("kc", subject);

		List<Document> users = newUsers();
		assertThat(users).as("the OpenCelium users other than the default admin").hasSize(1);
		Document user = users.getFirst();
		assertThat(hasOidcLink(user, ISSUER_URL, subject)).as("the OIDC link of the new OpenCelium user").isTrue();
		assertThat(user.getString("tenantId")).isEqualTo("self-host-tenant");
		assertThat(sessionUsers()).as("the OpenCelium user of the session").containsExactly(idOf(user));
	}

	@Test
	void callbackGivesTheNewOpenCeliumUserNoRoleAndNoPasswordWhenCoreMakesIt() {
		logIn("kc", newSubject());

		Document user = theOnlyNewUser();
		assertThat(user.getList("roles", String.class, List.of())).as("the roles of the new OpenCelium user").isEmpty();
		assertThat(user.get("passwordHash")).as("the password hash of the new OpenCelium user").isNull();
	}

	@Test
	void callbackGivesTheNewOpenCeliumUserTheProviderIdAHyphenAndTheSubjectAsUsernameWhenTheIdTokenHasNoEmail() {
		String subject = newSubject();

		logIn("kc", subject);

		assertThat(theOnlyNewUser().getString("username")).isEqualTo("kc-" + subject);
	}

	@Test
	void callbackAddsAHyphenAndANumberToTheUsernameWhenAnotherOpenCeliumUserHasIt() {
		UserFixture.aUser("kc-bob", UUID.randomUUID().toString()).storeIn(tenantRunner, documents);

		logIn("kc", "bob");

		List<Document> oidcUsers = newUsers().stream().filter(user -> hasOidcLink(user, ISSUER_URL, "bob")).toList();
		assertThat(oidcUsers).as("the OpenCelium users with the OIDC link").hasSize(1);
		assertThat(oidcUsers.getFirst().getString("username")).matches("kc-bob-[0-9]+");
	}

	@Test
	void callbackGivesTheOpenCeliumUserOfTheOidcLinkWithoutANewUserWhenThePersonLogsInAgain() {
		String subject = newSubject();
		logIn("kc", subject);
		String first = idOf(theOnlyNewUser());

		logIn("kc", subject);

		assertThat(idOf(theOnlyNewUser())).as("the OpenCelium user after the second login").isEqualTo(first);
		assertThat(sessionUsers()).as("the OpenCelium users of the 2 sessions").containsExactly(first, first);
	}

	@Test
	void callbackMakesAnotherOpenCeliumUserWhenTheSameSubjectLogsInThroughAnotherIssuer() {
		String subject = newSubject();
		logIn("kc", subject);

		logIn("kc2", subject);

		List<Document> users = newUsers();
		assertThat(users).as("the OpenCelium users other than the default admin").hasSize(2);
		assertThat(users).filteredOn(user -> hasOidcLink(user, ISSUER_URL, subject)).hasSize(1);
		assertThat(users).filteredOn(user -> hasOidcLink(user, OTHER_ISSUER_URL, subject)).hasSize(1);
		assertThat(sessionUsers()).as("the OpenCelium users of the 2 sessions").doesNotHaveDuplicates();
	}

	@Test
	void callbackMakesAnotherOpenCeliumUserWhenAnotherSubjectLogsInThroughTheSameIssuer() {
		String first = newSubject();
		String second = newSubject();
		logIn("kc", first);

		logIn("kc", second);

		List<Document> users = newUsers();
		assertThat(users).as("the OpenCelium users other than the default admin").hasSize(2);
		assertThat(users).filteredOn(user -> hasOidcLink(user, ISSUER_URL, first)).hasSize(1);
		assertThat(users).filteredOn(user -> hasOidcLink(user, ISSUER_URL, second)).hasSize(1);
	}

	@Test
	void insertRefusesASecondUserDocumentWithTheOidcLinkOfAnOpenCeliumUserWhenTheIssuerAndTheSubjectAreTheSame() {
		logIn("kc", newSubject());
		Document copy = copyOf(theOnlyNewUser(), "copy-with-the-same-oidc-link");

		assertThatExceptionOfType(DuplicateKeyException.class).isThrownBy(() -> mongo.insert(copy, "users"));
	}

	@Test
	void insertStoresASecondUserDocumentWithoutAnOidcLinkWhenAnOpenCeliumUserHasAnOidcLink() {
		logIn("kc", newSubject());
		Document admin = mongo.getCollection("users").find(new Document("username", ADMIN)).first();
		assertThat(admin).as("the default admin").isNotNull();
		Document copy = copyOf(admin, "copy-of-the-default-admin");

		mongo.insert(copy, "users");

		assertThat(mongo.getCollection("users").countDocuments(new Document("username", copy.getString("username"))))
			.isEqualTo(1);
	}

	/** A complete OIDC login of the person with the subject, without an email in the ID token. */
	private void logIn(String providerId, String subject) {
		String redirect = logInAtTheIdp(mvc, IDP, providerId, newLoginVerifierHash(), subject, Map.of());
		loginCodeOf(callback(mvc, redirect));
	}

	/**
	 * Whether the user document holds an embedded document, alone or in a list, with the issuer URL and the subject
	 * as values.
	 */
	private static boolean hasOidcLink(Document user, String issuer, String subject) {
		return user.values().stream().anyMatch(value -> holdsLink(value, issuer, subject));
	}

	private static boolean holdsLink(Object value, String issuer, String subject) {
		if (value instanceof Document embedded) {
			return embedded.containsValue(issuer) && embedded.containsValue(subject);
		}
		if (value instanceof List<?> list) {
			return list.stream().anyMatch(element -> holdsLink(element, issuer, subject));
		}
		return false;
	}

	/**
	 * A copy of the user document as a new document: another ID and another username, and no email, so that only the
	 * other fields can collide with the stored user.
	 */
	private static Document copyOf(Document user, String username) {
		Document copy = new Document(user);
		copy.remove("_id");
		copy.remove("email");
		copy.put("username", username);
		return copy;
	}

	private Document theOnlyNewUser() {
		List<Document> users = newUsers();
		assertThat(users).as("the OpenCelium users other than the default admin").hasSize(1);
		return users.getFirst();
	}

	private List<Document> newUsers() {
		return mongo.getCollection("users").find(new Document("username", new Document("$ne", ADMIN)))
			.into(new ArrayList<>());
	}

	/** The ID of the OpenCelium user of each session, in the order of the sessions. */
	private List<String> sessionUsers() {
		return mongo.getCollection("sessions").find().sort(new Document("startedAt", 1)).into(new ArrayList<>())
			.stream()
			.map(session -> session.getString("userId"))
			.toList();
	}

	private static String idOf(Document user) {
		return String.valueOf(user.get("_id"));
	}

	private static String newSubject() {
		return UUID.randomUUID().toString();
	}

}
