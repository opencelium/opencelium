package io.opencelium.core.auth;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.core.testsupport.CloudStart;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;

/**
 * In the cloud mode a login through the endpoint of core starts no session: only the Service Portal authenticates a
 * person. That the cloud mode has no local login strategy is the subject of {@link LoginStrategiesTest}; a user in
 * the database of core cannot show it here, because a login of the cloud mode has no tenant to read the user from.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class LoginCloudTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		CloudStart.register(registry, LoginCloudTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Test
	void loginGivesInvalidCredentialsWhenTheModeIsCloud() {
		MvcTestResult login = LoginRequests.logIn(mvc, "alice", "Alice-Password-1");

		LoginRequests.assertProblem(login, HttpStatus.UNAUTHORIZED, "invalid-credentials");
	}

}
