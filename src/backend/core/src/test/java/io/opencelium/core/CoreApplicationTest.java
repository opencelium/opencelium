package io.opencelium.core;

import java.nio.file.Path;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class CoreApplicationTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		// Resolved lazily at context start, after JUnit has created the directory.
		registry.add("opencelium.data-dir", () -> dataDir.toString());
		LocalMongo.register(registry, CoreApplicationTest.class);
	}

	@AfterAll
	static void dropDatabase() {
		LocalMongo.drop(CoreApplicationTest.class);
	}

	@Autowired
	OpenCeliumProperties properties;

	@Test
	void contextLoadsWithDocumentedDefaults() {
		assertThat(properties.deploymentMode()).isEqualTo(DeploymentMode.SELF);
	}

}
