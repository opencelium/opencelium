package io.opencelium.core.config;

import java.nio.file.Path;
import java.util.Map;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class DefaultsEnvironmentPostProcessorTest {

	@TempDir
	Path tmp;

	private final MockEnvironment environment = new MockEnvironment();

	@Test
	void emptyConfigurationGetsAllDocumentedDefaults() {
		postProcess();

		assertThat(environment.getProperty("opencelium.deployment-mode")).isEqualTo("self");
		assertThat(environment.getProperty("opencelium.data-dir")).isEqualTo(tmp.resolve("data").toString());
		assertThat(environment.getProperty("spring.mongodb.uri")).isEqualTo("mongodb://localhost:27017/opencelium");
	}

	@Test
	void defaultsHaveLowestPriority() {
		postProcess();

		PropertySource<?> last = environment.getPropertySources().stream().reduce((a, b) -> b).orElseThrow();
		assertThat(last.getName()).isEqualTo(DefaultsEnvironmentPostProcessor.PROPERTY_SOURCE_NAME);
	}

	@Test
	void logsOneDefaultLinePerAppliedDefault(CapturedOutput output) {
		postProcess();

		assertThat(output).containsOnlyOnce("opencelium.deployment-mode = self (default)");
		assertThat(output).containsOnlyOnce("opencelium.data-dir = " + tmp.resolve("data") + " (default)");
		assertThat(output).containsOnlyOnce("spring.mongodb.uri = mongodb://localhost:27017/opencelium (default)");
	}

	@Test
	void saasModeGetsNoMongoDefault(CapturedOutput output) {
		environment.setProperty("opencelium.deployment-mode", "saas");

		postProcess();

		assertThat(environment.containsProperty("spring.mongodb.uri")).isFalse();
		assertThat(output).doesNotContain("opencelium.deployment-mode = ");
	}

	@Test
	void invalidModeGetsNoMongoDefaultSoOnlyTheModeIsReported() {
		environment.setProperty("opencelium.deployment-mode", "cloud");

		postProcess();

		assertThat(environment.containsProperty("spring.mongodb.uri")).isFalse();
	}

	@Test
	void explicitValuesAreNeitherOverriddenNorLogged(CapturedOutput output) {
		environment.setProperty("opencelium.deployment-mode", "self");
		environment.setProperty("opencelium.data-dir", "/srv/oc");
		environment.setProperty("spring.mongodb.uri", "mongodb://db.example:27017/oc");

		postProcess();

		assertThat(environment.getProperty("spring.mongodb.uri")).isEqualTo("mongodb://db.example:27017/oc");
		assertThat(environment.getPropertySources().contains(DefaultsEnvironmentPostProcessor.PROPERTY_SOURCE_NAME)).isFalse();
		assertThat(output).doesNotContain("(default)");
	}

	@Test
	void explicitMongoHostSuppressesTheUriDefault() {
		environment.setProperty("spring.mongodb.host", "db.example");

		postProcess();

		assertThat(environment.containsProperty("spring.mongodb.uri")).isFalse();
	}

	@Test
	void relaxedEnvironmentVariableNameCountsAsSet() {
		environment.getPropertySources().addFirst(new SystemEnvironmentPropertySource(
				"systemEnvironment", Map.of("OPENCELIUM_DEPLOYMENTMODE", "saas")));

		postProcess();

		assertThat(environment.containsProperty("spring.mongodb.uri")).isFalse();
	}

	@Test
	void bootThreePropertyNameIsIgnoredWithAHint(CapturedOutput output) {
		environment.setProperty("spring.data.mongodb.uri", "mongodb://db.example:27017/oc");

		postProcess();

		assertThat(environment.getProperty("spring.mongodb.uri")).isEqualTo("mongodb://localhost:27017/opencelium");
		assertThat(output).contains("WARN").contains("spring.data.mongodb.uri").contains("did you mean spring.mongodb.uri");
	}

	private void postProcess() {
		var dataDirDefaults = new DataDirDefaults("Mac OS X", tmp, tmp.resolve("unused"));
		// Supplier::get as DeferredLogFactory: log immediately instead of deferring until logging is set up.
		new DefaultsEnvironmentPostProcessor(Supplier::get, dataDirDefaults)
				.postProcessEnvironment(environment, new SpringApplication());
	}

}
