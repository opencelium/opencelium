package io.opencelium.core.user;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
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

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.TenantTasks;
import io.opencelium.core.testsupport.fake.FakeIdp;
import io.opencelium.core.testsupport.fixture.UserFixture;

import static io.opencelium.core.testsupport.OidcLoginRequests.callback;
import static io.opencelium.core.testsupport.OidcLoginRequests.logInAtTheIdp;
import static io.opencelium.core.testsupport.OidcLoginRequests.loginCodeOf;
import static io.opencelium.core.testsupport.OidcLoginRequests.newLoginVerifierHash;
import static io.opencelium.core.testsupport.OidcLoginRequests.saveProviders;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.params.provider.Arguments.arguments;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * After a correct answer of the IdP core finds the OpenCelium user of the ID token with these rules, in this order:
 * <ol>
 * <li>The OpenCelium user with the OIDC link of the ID token, the pair of the issuer and the subject.</li>
 * <li>Else, when the email-link option of the OIDC provider is on and the claim {@code email_verified} is true, the
 * OpenCelium user with the email of the ID token, compared without a difference between upper case and lower case.
 * That OpenCelium user gets the OIDC link, so that the next login of the account finds it by the OIDC link, and an OIDC
 * link that it has already stays. The default admin, which has the role ADMIN, is such an OpenCelium user too.</li>
 * <li>Else core makes a new OpenCelium user with the OIDC link, without a role and without a password. It gets the
 * email of the ID token only when the claim {@code email_verified} is true. Its username is the provider ID, a hyphen
 * and the subject when the ID token has no verified email, with a hyphen and a number when an OpenCelium user has that
 * username.</li>
 * </ol>
 * A unique index refuses a second OpenCelium user with the OIDC link of another one, and it does not refuse OpenCelium
 * users without an OIDC link.
 * <p>
 * The email link adds the OIDC link in 1 conditional update: a user that is locked, or that has another email, after
 * the read by email does not get the link, and a link that the user has already stays once in the list. A login cannot
 * put a change between the read and the update, so these cases call the update of the repository itself.
 * <p>
 * Each login goes through the endpoints of core and the fake IdP: the session of a login names its OpenCelium user.
 * The tests find an OIDC link by its values, not by the names of its fields: an embedded document, alone or in a list,
 * with the issuer URL and the subject. The email-link option is off and an ID token has no email, unless a case gives
 * them. A case can give the default admin an email and an OIDC link, so each case starts with the default admin as the
 * start of core made it.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class OidcUserLookupTest {

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private static final String OTHER_ISSUER_URL = "https://idp2.example.com/realms/oc";

	private static final String CLIENT_ID = "core";

	private static final String ADMIN = SetupContext.DEFAULT_ADMIN_USERNAME;

	private static final Map<String, String> PROVIDERS = Map.of("kc", ISSUER_URL, "kc2", OTHER_ISSUER_URL);

	private static final String BOB_EMAIL = "bob@example.com";

	private static final String DAVE_EMAIL = "dave@example.com";

	private static final FakeIdp IDP = new FakeIdp();

	/** The user document of the default admin before the first case, as the start of core made it. */
	private static Document defaultAdmin;

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

	@Autowired
	UserRepository users;

	private final String clientSecret = UUID.randomUUID().toString();

	static ClientHttpRequestFactory fakeIdp() {
		return IDP;
	}

	/**
	 * Each case starts with the OIDC providers {@code kc} and {@code kc2} of 2 issuer URLs without the email-link
	 * option, the default admin as the start of core made it as the only OpenCelium user, and no session: the save of
	 * the OIDC providers needs a session of the default admin.
	 */
	@BeforeEach
	void saveTheProvidersWithoutASessionOrAnotherUser() {
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
		mongo.getCollection("oidc_logins").deleteMany(new Document());
		mongo.remove(new Query(where("username").ne(ADMIN)), "users");
		restoreTheDefaultAdmin();
		IDP.reset();
		IDP.serveDiscoveryDocument(ISSUER_URL);
		IDP.serveDiscoveryDocument(OTHER_ISSUER_URL);
		IDP.registerClient(CLIENT_ID, clientSecret);
		saveProviders(mvc, CLIENT_ID, clientSecret, PROVIDERS);
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

	@ParameterizedTest(name = "{0}")
	@ValueSource(strings = { BOB_EMAIL, "Bob@Example.COM" })
	void callbackGivesTheOpenCeliumUserWithTheEmailWithoutANewUserWhenTheEmailLinkOptionIsOnAndTheEmailIsVerified(
			String email) {
		String bob = storeUserWithBobsEmail();
		turnOnTheEmailLinkOption(Set.of("kc"));

		logIn("kc", newSubject(), verified(email));

		assertThat(newUsers()).as("the OpenCelium users other than the default admin")
			.extracting(OidcUserLookupTest::idOf)
			.containsExactly(bob);
		assertThat(sessionUsers()).as("the OpenCelium user of the session").containsExactly(bob);
	}

	@Test
	void callbackGivesTheOpenCeliumUserWithTheEmailTheOidcLinkOfTheIdTokenWhenTheEmailLinkOptionIsOn() {
		storeUserWithBobsEmail();
		turnOnTheEmailLinkOption(Set.of("kc"));
		String subject = newSubject();

		logIn("kc", subject, verified(BOB_EMAIL));

		assertThat(hasOidcLink(userNamed("bob"), ISSUER_URL, subject))
			.as("the OIDC link of the OpenCelium user with the email")
			.isTrue();
	}

	@Test
	void callbackGivesTheOpenCeliumUserOfTheEmailByItsOidcLinkWithoutANewUserWhenTheNextIdTokenHasNoEmail() {
		String bob = storeUserWithBobsEmail();
		turnOnTheEmailLinkOption(Set.of("kc"));
		String subject = newSubject();
		logIn("kc", subject, verified(BOB_EMAIL));

		logIn("kc", subject, Map.of());

		assertThat(newUsers()).as("the OpenCelium users other than the default admin")
			.extracting(OidcUserLookupTest::idOf)
			.containsExactly(bob);
		assertThat(sessionUsers()).as("the OpenCelium users of the 2 sessions").containsExactly(bob, bob);
	}

	@Test
	void callbackKeepsTheFirstOidcLinkOfTheOpenCeliumUserWhenTheEmailLinksAnAccountOfAnotherIssuerToIt() {
		String bob = storeUserWithBobsEmail();
		turnOnTheEmailLinkOption(Set.of("kc", "kc2"));
		String first = newSubject();
		String second = newSubject();
		logIn("kc", first, verified(BOB_EMAIL));

		logIn("kc2", second, verified(BOB_EMAIL));

		Document user = userNamed("bob");
		assertThat(newUsers()).as("the OpenCelium users other than the default admin")
			.extracting(OidcUserLookupTest::idOf)
			.containsExactly(bob);
		assertThat(hasOidcLink(user, ISSUER_URL, first)).as("the OIDC link of the first issuer").isTrue();
		assertThat(hasOidcLink(user, OTHER_ISSUER_URL, second)).as("the OIDC link of the second issuer").isTrue();
		assertThat(sessionUsers()).as("the OpenCelium users of the 2 sessions").containsExactly(bob, bob);
	}

	@Test
	void callbackGivesTheDefaultAdminASessionAndTheOidcLinkWhenTheEmailLinkOptionIsOnAndTheAdminHasTheVerifiedEmail() {
		mongo.getCollection("users")
			.updateOne(new Document("username", ADMIN), new Document("$set", new Document("email", BOB_EMAIL)));
		turnOnTheEmailLinkOption(Set.of("kc"));
		String subject = newSubject();

		logIn("kc", subject, verified(BOB_EMAIL));

		Document admin = userNamed(ADMIN);
		assertThat(newUsers()).as("the OpenCelium users other than the default admin").isEmpty();
		assertThat(sessionUsers()).as("the OpenCelium user of the session").containsExactly(idOf(admin));
		assertThat(hasOidcLink(admin, ISSUER_URL, subject)).as("the OIDC link of the default admin").isTrue();
	}

	@Test
	void callbackGivesTheOpenCeliumUserOfTheOidcLinkWhenTheEmailLinkOptionIsOnAndAnotherUserHasTheVerifiedEmail() {
		turnOnTheEmailLinkOption(Set.of("kc"));
		String subject = newSubject();
		logIn("kc", subject, Map.of());
		String linked = idOf(theOnlyNewUser());
		storeUserWithBobsEmail();

		logIn("kc", subject, verified(BOB_EMAIL));

		assertThat(sessionUsers()).as("the OpenCelium users of the 2 sessions").containsExactly(linked, linked);
		assertThat(newUsers()).as("the OpenCelium users other than the default admin").hasSize(2);
		assertThat(hasOidcLink(userNamed("bob"), ISSUER_URL, subject))
			.as("the OIDC link of the OpenCelium user with the email")
			.isFalse();
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("emailLinkOptions")
	void callbackGivesTheNewOpenCeliumUserTheEmailWhenTheEmailIsVerifiedAndNoOpenCeliumUserHasIt(String option,
			Set<String> emailLink) {
		turnOnTheEmailLinkOption(emailLink);

		logIn("kc", newSubject(), verified(DAVE_EMAIL));

		assertThat(theOnlyNewUser().get("email")).as("the email of the new OpenCelium user").isEqualTo(DAVE_EMAIL);
	}

	/** The name of each case and the provider IDs whose email-link option is on. */
	static Stream<Arguments> emailLinkOptions() {
		return Stream.of(arguments("the email-link option off", Set.of()),
				arguments("the email-link option on", Set.of("kc")));
	}

	@ParameterizedTest(name = "{0}")
	@MethodSource("unverifiedEmails")
	void callbackMakesANewOpenCeliumUserWithoutAnEmailWhenAnotherOpenCeliumUserHasTheEmailAndTheEmailIsNotVerified(
			String unverified, Set<String> emailLink, Map<String, ?> claims) {
		String bob = storeUserWithBobsEmail();
		Document bobBefore = userNamed("bob");
		turnOnTheEmailLinkOption(emailLink);
		String subject = newSubject();

		logIn("kc", subject, claims);

		List<Document> linked = newUsers().stream().filter(user -> hasOidcLink(user, ISSUER_URL, subject)).toList();
		assertThat(linked).as("the OpenCelium users with the OIDC link").hasSize(1);
		Document user = linked.getFirst();
		assertThat(idOf(user)).as("the OpenCelium user of the OIDC link").isNotEqualTo(bob);
		assertThat(user.get("email")).as("the email of the new OpenCelium user").isNull();
		assertThat(sessionUsers()).as("the OpenCelium user of the session").containsExactly(idOf(user));
		assertThat(userNamed("bob")).as("the OpenCelium user with the email").isEqualTo(bobBefore);
	}

	/**
	 * The name of each case, the provider IDs whose email-link option is on, and the claims of an ID token with the
	 * email of the stored OpenCelium user {@code bob} that the IdP did not verify.
	 */
	static Stream<Arguments> unverifiedEmails() {
		return Stream.of(
				arguments("email_verified false, the email-link option on", Set.of("kc"),
						Map.of("email", BOB_EMAIL, "email_verified", false)),
				arguments("no email_verified, the email-link option on", Set.of("kc"), Map.of("email", BOB_EMAIL)),
				arguments("email_verified false, the email-link option off", Set.of(),
						Map.of("email", BOB_EMAIL, "email_verified", false)));
	}

	@Test
	void addOidcLinkIfUnlockedChangesNoUserWhenTheUserIsLocked() {
		String bob = UserFixture.aUser("bob", UUID.randomUUID().toString())
			.withEmail(BOB_EMAIL)
			.locked()
			.storeIn(tenantRunner, documents)
			.id();
		Document bobBefore = userNamed("bob");

		long changed = addOidcLink(bob, BOB_EMAIL, newSubject());

		assertThat(changed).as("the changed users").isZero();
		assertThat(userNamed("bob")).as("the locked user").isEqualTo(bobBefore);
	}

	@Test
	void addOidcLinkIfUnlockedChangesNoUserWhenTheUserHasAnotherEmail() {
		String bob = storeUserWithBobsEmail();
		Document bobBefore = userNamed("bob");

		long changed = addOidcLink(bob, "other@example.com", newSubject());

		assertThat(changed).as("the changed users").isZero();
		assertThat(userNamed("bob")).as("the user with another email").isEqualTo(bobBefore);
	}

	@Test
	void addOidcLinkIfUnlockedKeepsTheOidcLinkOnceWhenTheSameLinkIsAddedTwice() {
		String bob = storeUserWithBobsEmail();
		String subject = newSubject();

		long first = addOidcLink(bob, BOB_EMAIL, subject);
		long second = addOidcLink(bob, BOB_EMAIL, subject);

		assertThat(first).as("the changed users of the first update").isEqualTo(1);
		assertThat(second).as("the users of the second update").isEqualTo(1);
		List<?> links = userNamed("bob").getList("oidcLinks", Object.class, List.of());
		assertThat(links).as("the OIDC links of the user").hasSize(1);
		assertThat(hasOidcLink(userNamed("bob"), ISSUER_URL, subject)).as("the OIDC link of the user").isTrue();
	}

	/** The conditional update of the email link, in the self-host tenant, with an OIDC link of {@code kc}. */
	private long addOidcLink(String userId, String email, String subject) {
		var link = new UserDocument.OidcLink(ISSUER_URL, subject);
		return TenantTasks.call(tenantRunner, TenantId.SELF_HOST,
				() -> users.addOidcLinkIfUnlocked(userId, email, link));
	}

	/** A complete OIDC login of the person with the subject, without an email in the ID token. */
	private void logIn(String providerId, String subject) {
		logIn(providerId, subject, Map.of());
	}

	/** A complete OIDC login of the person with the subject, with the claims in the ID token. */
	private void logIn(String providerId, String subject, Map<String, ?> claims) {
		String redirect = logInAtTheIdp(mvc, IDP, providerId, newLoginVerifierHash(), subject, claims);
		loginCodeOf(callback(mvc, redirect));
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

	/** Stores the OpenCelium user {@code bob} with the email {@value #BOB_EMAIL}, as core stores a user. */
	private String storeUserWithBobsEmail() {
		return UserFixture.aUser("bob", UUID.randomUUID().toString())
			.withEmail(BOB_EMAIL)
			.storeIn(tenantRunner, documents)
			.id();
	}

	/**
	 * Puts back the user document of the default admin as the start of core made it, without an email or an OIDC link
	 * that a case gave it.
	 */
	private void restoreTheDefaultAdmin() {
		if (defaultAdmin == null) {
			defaultAdmin = userNamed(ADMIN);
		}
		mongo.getCollection("users").replaceOne(new Document("_id", defaultAdmin.get("_id")), defaultAdmin);
	}

	private Document userNamed(String username) {
		Document user = mongo.getCollection("users").find(new Document("username", username)).first();
		assertThat(user).as("the OpenCelium user " + username).isNotNull();
		return user;
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
