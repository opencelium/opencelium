package io.opencelium.core.settings;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;

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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.Bytes;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.SettingsRequests;
import io.opencelium.core.testsupport.fixture.UserFixture;

import static io.opencelium.core.testsupport.SettingsRequests.field;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * An admin of a self-host installation reads and changes the settings of the installation through the settings API,
 * and each setting without a value in the database has its default. A change with an incorrect setting key or value
 * changes nothing. An OpenCelium user without the admin role gets {@code access-denied}, and a request without a
 * session JWT gets the status code 401 and no body.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
@ExtendWith(OutputCaptureExtension.class)
class SettingsEndpointTest {

	private static final String PASSWORD = "Br0ker-Pass-7731";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, SettingsEndpointTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	TenantDocuments documents;

	@BeforeEach
	void removeTheSettingsOfAnotherTest() {
		mongo.getCollection("settings").deleteMany(new Document());
		mongo.getCollection("secrets").deleteMany(new Document());
	}

	@Test
	void getGivesTheDefaultOfEachSettingWhenTheDatabaseHasNoValue() {
		MvcTestResult read = SettingsRequests.read(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));

		assertThat(read).hasStatusOk();
		assertThat(read).bodyJson().extractingPath(field("broker.host", "value")).isNull();
		assertThat(read).bodyJson().extractingPath(field("broker.port", "value")).isEqualTo(5672);
		assertThat(read).bodyJson().extractingPath(field("broker.virtual-host", "value")).isEqualTo("/");
		assertThat(read).bodyJson().extractingPath(field("broker.username", "value")).isNull();
		for (String settingKey : new String[] { "broker.host", "broker.port", "broker.virtual-host",
				"broker.username" }) {
			assertThat(read).bodyJson().extractingPath(field(settingKey, "default")).as(settingKey).isEqualTo(true);
		}
	}

	@Test
	void getGivesTheDatabaseValueWhenTheDatabaseHasOne() {
		mongo.getCollection("settings").insertOne(new Document("_id", "installation").append("broker",
				new Document("port", 5673).append("virtual-host", "/oc")));

		MvcTestResult read = SettingsRequests.read(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));

		assertThat(read).hasStatusOk();
		assertThat(read).bodyJson().extractingPath(field("broker.port", "value")).isEqualTo(5673);
		assertThat(read).bodyJson().extractingPath(field("broker.port", "default")).isEqualTo(false);
		assertThat(read).bodyJson().extractingPath(field("broker.virtual-host", "value")).isEqualTo("/oc");
		assertThat(read).bodyJson().extractingPath(field("broker.virtual-host", "default")).isEqualTo(false);
		assertThat(read).bodyJson().extractingPath(field("broker.host", "default")).isEqualTo(true);
	}

	@Test
	void getKeepsTheSettingsCollectionEmptyWhenAnAdminReadsTheSettings() {
		MvcTestResult read = SettingsRequests.read(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));

		assertThat(read).hasStatusOk();
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
	}

	@Test
	void getGivesAccessDeniedWhenTheUserHasNoAdminRole() {
		UserFixture.aUser("bob", "Bob-Password-1").storeIn(tenantRunner, documents);
		MvcTestResult login = LoginRequests.logIn(mvc, "bob", "Bob-Password-1");
		assertThat(login).as("the login of a user without a role").hasStatusOk();

		MvcTestResult read = SettingsRequests.read(mvc, LoginRequests.sessionJwtOf(login));

		LoginRequests.assertProblem(read, HttpStatus.FORBIDDEN, "access-denied");
		assertThat(read).bodyJson().extractingPath("$.instance").isEqualTo(SettingsRequests.PATH);
		assertThat(read).bodyText().doesNotContain("broker.");
	}

	@Test
	void patchGivesTheNewValueWhenTheValueIsValid() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		MvcTestResult change = SettingsRequests.change(mvc, admin,
				"{\"broker.host\": \"rabbit.internal\", \"broker.port\": 5673}");

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(field("broker.host", "value")).isEqualTo("rabbit.internal");
		assertThat(change).bodyJson().extractingPath(field("broker.host", "default")).isEqualTo(false);
		assertThat(change).bodyJson().extractingPath(field("broker.port", "value")).isEqualTo(5673);
		assertThat(change).bodyJson().extractingPath(field("broker.virtual-host", "default")).isEqualTo(true);
		MvcTestResult read = SettingsRequests.read(mvc, admin);
		assertThat(read).bodyJson().extractingPath(field("broker.port", "value")).isEqualTo(5673);
	}

	@Test
	void patchGivesInvalidSettingsWithEachIncorrectKeyWhenAKeyIsUnknown() {
		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				"{\"broker.port\": \"abc\", \"broker.vhost\": \"x\"}");

		LoginRequests.assertProblem(change, HttpStatus.BAD_REQUEST, "invalid-settings");
		assertThat(change).bodyJson().extractingPath("$.errors[0].key").isEqualTo("broker.port");
		assertThat(change).bodyJson().extractingPath("$.errors[0].problem").isEqualTo("invalid-value");
		assertThat(change).bodyJson().extractingPath("$.errors[1].key").isEqualTo("broker.vhost");
		assertThat(change).bodyJson().extractingPath("$.errors[1].problem").isEqualTo("unknown-key");
		assertThat(change).bodyText().doesNotContain("abc");
	}

	@Test
	void patchChangesNoSettingWhenOneOfTwoValuesIsNotValid() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		MvcTestResult change = SettingsRequests.change(mvc, admin,
				"{\"broker.host\": \"rabbit.internal\", \"broker.port\": 0}");

		LoginRequests.assertProblem(change, HttpStatus.BAD_REQUEST, "invalid-settings");
		MvcTestResult read = SettingsRequests.read(mvc, admin);
		assertThat(read).bodyJson().extractingPath(field("broker.host", "default")).isEqualTo(true);
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
	}

	@Test
	void patchResetsTheSettingWhenTheValueIsNull() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(SettingsRequests.change(mvc, admin,
				"{\"broker.host\": \"rabbit.internal\", \"broker.port\": 5673}")).as("the change before the reset")
				.hasStatusOk();

		MvcTestResult reset = SettingsRequests.change(mvc, admin, MediaType.valueOf("application/merge-patch+json"),
				"{\"broker.port\": null}");

		assertThat(reset).hasStatusOk();
		assertThat(reset).bodyJson().extractingPath(field("broker.port", "value")).isEqualTo(5672);
		assertThat(reset).bodyJson().extractingPath(field("broker.port", "default")).isEqualTo(true);
		assertThat(reset).bodyJson().extractingPath(field("broker.host", "value")).isEqualTo("rabbit.internal");
		Document broker = mongo.getCollection("settings").find(new Document("_id", "installation")).first()
				.get("broker", Document.class);
		assertThat(broker).isEqualTo(new Document("host", "rabbit.internal"));
	}

	@Test
	void patchGivesInvalidSettingsWhenTheUsernameHasALineFeed() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		MvcTestResult change = SettingsRequests.change(mvc, admin, "{\"broker.username\": \"oc\\nadmin\"}");

		LoginRequests.assertProblem(change, HttpStatus.BAD_REQUEST, "invalid-settings");
		assertThat(change).bodyJson().extractingPath("$.errors[0].key").isEqualTo("broker.username");
		assertThat(change).bodyJson().extractingPath("$.errors[0].problem").isEqualTo("invalid-value");
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
	}

	@Test
	void patchGivesBadRequestWhenTheBodyIsNotAJsonObject() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);

		LoginRequests.assertProblem(SettingsRequests.change(mvc, admin, "[\"broker.port\", 5673]"),
				HttpStatus.BAD_REQUEST, "bad-request");
		LoginRequests.assertProblem(SettingsRequests.change(mvc, admin, "broker.port=5673"), HttpStatus.BAD_REQUEST,
				"bad-request");
	}

	@Test
	void patchGivesAccessDeniedWhenTheUserHasNoAdminRole() {
		UserFixture.aUser("carol", "Carol-Password-1").storeIn(tenantRunner, documents);
		MvcTestResult login = LoginRequests.logIn(mvc, "carol", "Carol-Password-1");
		assertThat(login).as("the login of a user without a role").hasStatusOk();

		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOf(login),
				"{\"broker.host\": \"attacker.example\"}");

		LoginRequests.assertProblem(change, HttpStatus.FORBIDDEN, "access-denied");
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
	}

	@Test
	void patchGivesAccessDeniedWhenAUserWithoutTheAdminRoleSendsABadBody() {
		UserFixture.aUser("dave", "Dave-Password-1").storeIn(tenantRunner, documents);
		MvcTestResult login = LoginRequests.logIn(mvc, "dave", "Dave-Password-1");
		assertThat(login).as("the login of a user without a role").hasStatusOk();

		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOf(login), "[1]");

		LoginRequests.assertProblem(change, HttpStatus.FORBIDDEN, "access-denied");
	}

	@Test
	void patchGivesBadRequestWhenTheBodyIsLongerThan64Kilobytes() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		String longBody = "{\"broker.username\": \"" + "u".repeat(64 * 1024) + "\"}";

		MvcTestResult change = SettingsRequests.change(mvc, admin, longBody);

		LoginRequests.assertProblem(change, HttpStatus.BAD_REQUEST, "bad-request");
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
	}

	@Test
	void patchShowsTheMaskWhenTheBrokerPasswordIsSet() {
		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				passwordBody(PASSWORD));

		assertThat(change).hasStatusOk();
		assertThat(change).bodyJson().extractingPath(field("broker.password", "value")).isEqualTo("****");
		assertThat(change).bodyJson().extractingPath(field("broker.password", "default")).isEqualTo(false);
		assertThat(change).bodyText().doesNotContain(PASSWORD);
	}

	@Test
	void getShowsTheMaskWhenTheBrokerPasswordIsSet() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(SettingsRequests.change(mvc, admin, passwordBody(PASSWORD))).as("the change of the password")
				.hasStatusOk();

		MvcTestResult read = SettingsRequests.read(mvc, admin);

		assertThat(read).bodyJson().extractingPath(field("broker.password", "value")).isEqualTo("****");
		assertThat(read).bodyText().doesNotContain(PASSWORD);
	}

	@Test
	void getShowsNullWhenTheBrokerPasswordIsNotSet() {
		MvcTestResult read = SettingsRequests.read(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc));

		assertThat(read).hasStatusOk();
		assertThat(read).bodyJson().extractingPath(field("broker.password", "value")).isNull();
		assertThat(read).bodyJson().extractingPath(field("broker.password", "default")).isEqualTo(true);
	}

	@Test
	void patchDeletesTheCiphertextWhenTheBrokerPasswordIsReset() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(SettingsRequests.change(mvc, admin, passwordBody(PASSWORD))).as("the change of the password")
				.hasStatusOk();

		MvcTestResult reset = SettingsRequests.change(mvc, admin, "{\"broker.password\": null}");

		assertThat(reset).bodyJson().extractingPath(field("broker.password", "value")).isNull();
		assertThat(reset).bodyJson().extractingPath(field("broker.password", "default")).isEqualTo(true);
		assertThat(mongo.getCollection("secrets").countDocuments()).isZero();
	}

	@Test
	void patchDeletesTheReplacedCiphertextWhenTheBrokerPasswordChanges() {
		String admin = LoginRequests.sessionJwtOfTheDefaultAdmin(mvc);
		assertThat(SettingsRequests.change(mvc, admin, passwordBody(PASSWORD))).as("the first password")
				.hasStatusOk();

		MvcTestResult change = SettingsRequests.change(mvc, admin, passwordBody("Another-Pass-2"));

		assertThat(change).hasStatusOk();
		assertThat(mongo.getCollection("secrets").countDocuments()).isOne();
		Document secret = mongo.getCollection("secrets").find().first();
		Document reference = mongo.getCollection("settings").find(new Document("_id", "installation")).first()
				.get("broker", Document.class).get("password", Document.class);
		assertThat(reference.getString("id")).isEqualTo(secret.getString("_id"));
	}

	@Test
	void patchWritesNoPlaintextToACollectionOrTheLogWhenTheBrokerPasswordIsSet(CapturedOutput output) {
		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				passwordBody(PASSWORD));

		assertThat(change).hasStatusOk();
		assertThat(mongo.getCollection("secrets").countDocuments()).isOne();
		for (String collection : mongo.getCollectionNames()) {
			for (Document document : mongo.getCollection(collection).find()) {
				assertNoPassword(document, collection);
			}
		}
		assertThat(output.getAll()).doesNotContain(PASSWORD);
	}

	@Test
	void patchGivesInvalidSettingsWithoutThePasswordWhenThePasswordHasALineFeed() {
		MvcTestResult change = SettingsRequests.change(mvc, LoginRequests.sessionJwtOfTheDefaultAdmin(mvc),
				"{\"broker.password\": \"Br0ker\\nPass\"}");

		LoginRequests.assertProblem(change, HttpStatus.BAD_REQUEST, "invalid-settings");
		assertThat(change).bodyJson().extractingPath("$.errors[0].key").isEqualTo("broker.password");
		assertThat(change).bodyJson().extractingPath("$.errors[0].problem").isEqualTo("invalid-value");
		assertThat(change).bodyText().doesNotContain("Br0ker");
		assertThat(mongo.getCollection("secrets").countDocuments()).isZero();
	}

	@Test
	void getGivesStatus401WithoutABodyWhenTheRequestHasNoToken() {
		MvcTestResult read = mvc.get().uri(SettingsRequests.PATH).exchange();

		assertThat(read).hasStatus(HttpStatus.UNAUTHORIZED).headers().hasHeaderSatisfying(HttpHeaders.WWW_AUTHENTICATE,
				values -> assertThat(values).singleElement().asString().startsWith("Bearer"));
		assertThat(read).bodyText().isEmpty();
	}

	private static String passwordBody(String password) {
		return "{\"broker.password\": \"" + password + "\"}";
	}

	/** Each value of the document, also inside a subdocument, a list or as bytes, does not hold the password. */
	private static void assertNoPassword(Object value, String place) {
		if (value instanceof Document document) {
			document.forEach((key, field) -> assertNoPassword(field, place + "." + key));
		}
		else if (value instanceof List<?> list) {
			list.forEach(item -> assertNoPassword(item, place));
		}
		else if (value instanceof String text) {
			assertThat(text).as(place).doesNotContain(PASSWORD);
		}
		else if (value instanceof Binary binary) {
			assertThat(Bytes.contains(binary.getData(), PASSWORD.getBytes(StandardCharsets.UTF_8))).as(place).isFalse();
		}
	}

}
