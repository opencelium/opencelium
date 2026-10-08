package io.opencelium.core;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
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
		assertThat(properties.deploymentMode()).isEqualTo(DeploymentMode.SELF);
	}

}
