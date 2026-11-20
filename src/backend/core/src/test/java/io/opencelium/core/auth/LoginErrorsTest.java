package io.opencelium.core.auth;

import java.nio.file.Path;
import java.util.List;

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
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.tenant.TenantDocuments;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.fixture.UserFixture;
import io.opencelium.core.user.UserDocument;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.data.mongodb.core.query.Criteria.where;
import static org.springframework.data.mongodb.core.query.Query.query;

/**
 * A failed login gives an error response with a code. The response does not show which usernames and emails exist,
 * and it shows a lock only to the correct password. The application log of a failed login shows neither the name nor
 * the password.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class LoginErrorsTest {

	private static final String PASSWORD = "Correct-Password-1";

	private static final String WRONG_PASSWORD = "Wrong-Password-1";

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, LoginErrorsTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Autowired
	MongoTemplate mongo;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	TenantDocuments documents;

	/** Each test stores its own users; the default admin of the setup stays. */
	@BeforeEach
	void removeTheUsersOfTheFixture() {
		mongo.remove(query(where("username").ne(SetupContext.DEFAULT_ADMIN_USERNAME)), UserDocument.class);
	}

	@Test
	void loginGivesTheSameResponseWhenTheUsernameTheEmailOrThePasswordIsWrong() {
		UserFixture.aUser("alice", PASSWORD).withEmail("alice@example.com").storeIn(tenantRunner, documents);

		List<MvcTestResult> attempts = List.of(LoginRequests.logIn(mvc, "nobody", PASSWORD),
				LoginRequests.logIn(mvc, "nobody@example.com", PASSWORD),
				LoginRequests.logIn(mvc, "alice", WRONG_PASSWORD),
				LoginRequests.logIn(mvc, "alice@example.com", WRONG_PASSWORD));

		for (MvcTestResult attempt : attempts) {
			LoginRequests.assertProblem(attempt, HttpStatus.UNAUTHORIZED, "invalid-credentials");
		}
		assertThat(attempts).extracting(LoginRequests::bodyOf).containsOnly(LoginRequests.bodyOf(attempts.getFirst()));
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void loginWritesNoNameAndNoPasswordToTheLogWhenItFails(CapturedOutput output) {
		// Values that occur nowhere else in the log, so that a match can only come from the failed logins.
		UserFixture.aUser("bob-7qx", PASSWORD).withEmail("bob-7qx@example.com").storeIn(tenantRunner, documents);

		LoginRequests.logIn(mvc, "Unknown-Name-7qx", "Typed-Password-7qx");
		LoginRequests.logIn(mvc, "bob-7qx", "Wrong-Password-7qx");
		LoginRequests.logIn(mvc, "Bob-7qx@Example.com", "Wrong-Password-7qx");

		// The log names the code of the response, so a log without a line of the failed logins does not pass.
		assertThat(output).contains("invalid-credentials").doesNotContainIgnoringCase("Unknown-Name-7qx")
				.doesNotContainIgnoringCase("Typed-Password-7qx").doesNotContainIgnoringCase("bob-7qx")
				.doesNotContainIgnoringCase("Wrong-Password-7qx");
	}

	@Test
	void loginGivesUserLockedWhenTheUserIsLockedAndThePasswordIsCorrect() {
		UserFixture.aUser("carol", PASSWORD).locked().storeIn(tenantRunner, documents);

		MvcTestResult login = LoginRequests.logIn(mvc, "carol", PASSWORD);

		LoginRequests.assertProblem(login, HttpStatus.FORBIDDEN, "user-locked");
	}

	@Test
	void loginGivesInvalidCredentialsWhenTheUserIsLockedAndThePasswordIsWrong() {
		UserFixture.aUser("dave", PASSWORD).locked().storeIn(tenantRunner, documents);

		MvcTestResult login = LoginRequests.logIn(mvc, "dave", WRONG_PASSWORD);

		LoginRequests.assertProblem(login, HttpStatus.UNAUTHORIZED, "invalid-credentials");
		assertThat(LoginRequests.bodyOf(login))
				.isEqualTo(LoginRequests.bodyOf(LoginRequests.logIn(mvc, "nobody", WRONG_PASSWORD)));
	}

	@Test
	void loginGivesASessionWhenTheUserMustChangeAGeneratedPassword() {
		UserFixture.aUser("erin", PASSWORD).withAGeneratedPassword().storeIn(tenantRunner, documents);

		MvcTestResult login = LoginRequests.logIn(mvc, "erin", PASSWORD);

		assertThat(login).hasStatusOk();
		assertThat(LoginRequests.sessionJwtOf(login)).isNotBlank();
	}

	@Test
	void loginGivesBadRequestWhenTheBodyHasNoPassword() {
		MvcTestResult login = mvc.post().uri(LoginRequests.LOGIN_PATH).contentType(MediaType.APPLICATION_JSON)
				.content("{\"username\": \"" + SetupContext.DEFAULT_ADMIN_USERNAME + "\"}").exchange();

		LoginRequests.assertProblem(login, HttpStatus.BAD_REQUEST, "bad-request");
	}

}
