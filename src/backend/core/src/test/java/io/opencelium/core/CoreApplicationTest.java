package io.opencelium.core;

import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;

@MongoIntegrationTest
class CoreApplicationTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, CoreApplicationTest.class, () -> dataDir);
	}

	@Autowired
	OpenCeliumProperties properties;

	@Test
	void contextLoadsWithDocumentedDefaults() {
		assertThat(properties.deploymentMode()).isEqualTo(DeploymentMode.SELF_HOST);
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void startMakesNoSpringSecurityUserAndLogsNoPasswordWhenTheWebServerRuns(CapturedOutput output) {
		// Spring Security configures itself for a web application only, so this start runs the web server.
		try (ConfigurableApplicationContext context = CoreStartup.run(Map.of(), dataDir,
				CoreStartup.mongoUri(LocalMongo.uriFor(CoreApplicationTest.class)),
				CoreStartup.arg("spring.main.web-application-type", "servlet"), CoreStartup.arg("server.port", "0"))) {
			assertThat(context.getEnvironment().getProperty("local.server.port")).isNotNull();
			// The source of the line: Spring Boot's user with a generated password. Only OpenCelium users log in.
			assertThat(context.getBeansOfType(InMemoryUserDetailsManager.class)).isEmpty();
		}

		assertThat(output).doesNotContain("generated security password");
	}

}
