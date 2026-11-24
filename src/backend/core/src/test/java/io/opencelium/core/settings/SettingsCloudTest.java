package io.opencelium.core.settings;

import java.nio.file.Path;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.secrets.keys.TokenSignature;
import io.opencelium.core.testsupport.CloudStart;
import io.opencelium.core.testsupport.LoginRequests;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.SettingsRequests;
import io.opencelium.core.testsupport.fixture.SessionJwtFixture;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * In the cloud mode no OpenCelium user reads or changes a setting of the installation, also an admin of a tenant: a
 * change would apply to each tenant. The session JWT comes from the fixture, because the cloud mode has no login of
 * core.
 */
@MongoIntegrationTest
@AutoConfigureMockMvc
class SettingsCloudTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		CloudStart.register(registry, SettingsCloudTest.class, () -> dataDir);
	}

	@Autowired
	MockMvcTester mvc;

	@Autowired
	TokenSignature signature;

	@Autowired
	MongoTemplate mongo;

	@Test
	void getGivesAccessDeniedWhenTheModeIsCloud() {
		String adminOfATenant = SessionJwtFixture.sessionJwt(signature, TenantId.of("tenant-a"), Set.of("ADMIN"));

		MvcTestResult read = SettingsRequests.read(mvc, adminOfATenant);

		LoginRequests.assertProblem(read, HttpStatus.FORBIDDEN, "access-denied");
		assertThat(read).bodyText().doesNotContain("broker.");
	}

	@Test
	void patchGivesAccessDeniedWhenTheModeIsCloud() {
		String adminOfATenant = SessionJwtFixture.sessionJwt(signature, TenantId.of("tenant-a"), Set.of("ADMIN"));

		MvcTestResult change = SettingsRequests.change(mvc, adminOfATenant,
				"{\"broker.host\": \"attacker.example\"}");

		LoginRequests.assertProblem(change, HttpStatus.FORBIDDEN, "access-denied");
		assertThat(mongo.getCollection("settings").countDocuments()).isZero();
	}

}
