package io.opencelium.core.config;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.function.Supplier;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.assertj.AssertableApplicationContext;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNullPointerException;

class OpenCeliumPropertiesTest {

	@TempDir
	Path tmp;

	@Test
	void absentModeIsSelf() {
		runner().run(context -> assertThat(properties(context).deploymentMode()).isEqualTo(DeploymentMode.SELF));
	}

	@Test
	void saasModeIsParsed() {
		runner().withPropertyValues("opencelium.deployment-mode=saas")
				.run(context -> assertThat(properties(context).deploymentMode()).isEqualTo(DeploymentMode.SAAS));
	}

	@Test
	void modeIsCaseInsensitive() {
		runner().withPropertyValues("opencelium.deployment-mode=SAAS")
				.run(context -> assertThat(properties(context).deploymentMode()).isEqualTo(DeploymentMode.SAAS));
	}

	@Test
	void unknownModeStopsNamingTheProperty() {
		runner().withPropertyValues("opencelium.deployment-mode=cloud").run(context -> {
			BootstrapPropertyException failure = bootstrapFailure(context);
			assertThat(failure.propertyName()).isEqualTo("opencelium.deployment-mode");
			assertThat(failure.getMessage()).contains("'cloud'").contains("self").contains("saas");
		});
	}

	@Test
	void absentDataDirUsesDefault() {
		runner().run(context -> assertThat(properties(context).dataDir()).isEqualTo(tmp.resolve("data")));
	}

	@Test
	void dataDirIsNormalized() {
		runner().withPropertyValues("opencelium.data-dir=" + tmp.resolve("a/../b"))
				.run(context -> assertThat(properties(context).dataDir()).isEqualTo(tmp.resolve("b")).isAbsolute());
	}

	@Test
	void dataDirThatIsAFileStopsNamingTheProperty() throws Exception {
		Path file = Files.writeString(tmp.resolve("not-a-dir"), "x");

		runner().withPropertyValues("opencelium.data-dir=" + file).run(context -> {
			BootstrapPropertyException failure = bootstrapFailure(context);
			assertThat(failure.propertyName()).isEqualTo("opencelium.data-dir");
			assertThat(failure.getMessage()).contains(file.toString()).contains("not a directory");
		});
	}

	@Test
	void parsingDoesNotCreateTheDataDir() {
		var environment = new MockEnvironment()
				.withProperty("opencelium.deployment-mode", "self")
				.withProperty("opencelium.data-dir", tmp.resolve("missing").toString());

		OpenCeliumProperties properties = OpenCeliumProperties.from(environment);

		assertThat(properties.dataDir()).isEqualTo(tmp.resolve("missing"));
		assertThat(tmp.resolve("missing")).doesNotExist();
	}

	@Test
	void masterKeyFileIsOptional() {
		runner().run(context -> assertThat(properties(context).masterKeyFile()).isEmpty());
	}

	@Test
	void masterKeyFileIsMadeAbsoluteButNotValidatedYet() {
		runner().withPropertyValues("opencelium.master-key-file=" + tmp.resolve("missing.key"))
				.run(context -> assertThat(properties(context).masterKeyFile()).contains(tmp.resolve("missing.key")));
	}

	@Test
	void constructorRejectsNulls() {
		assertThatNullPointerException().isThrownBy(() -> new OpenCeliumProperties(null, tmp, Optional.empty()))
				.withMessage("deploymentMode");
		assertThatNullPointerException()
				.isThrownBy(() -> new OpenCeliumProperties(DeploymentMode.SELF, null, Optional.empty()))
				.withMessage("dataDir");
		assertThatNullPointerException().isThrownBy(() -> new OpenCeliumProperties(DeploymentMode.SELF, tmp, null))
				.withMessage("masterKeyFile");
	}

	private ApplicationContextRunner runner() {
		var dataDirDefaults = new DataDirDefaults("Mac OS X", tmp, tmp.resolve("unused"));
		return new ApplicationContextRunner()
				.withUserConfiguration(BootstrapConfig.class)
				// Supplier::get as DeferredLogFactory: log immediately instead of deferring until logging is set up.
				.withInitializer(context -> new DefaultsEnvironmentPostProcessor(Supplier::get, dataDirDefaults)
						.postProcessEnvironment(context.getEnvironment(), new SpringApplication()));
	}

	private static OpenCeliumProperties properties(AssertableApplicationContext context) {
		assertThat(context).hasNotFailed();
		return context.getBean(OpenCeliumProperties.class);
	}

	private static BootstrapPropertyException bootstrapFailure(AssertableApplicationContext context) {
		assertThat(context).hasFailed();
		assertThat(context.getStartupFailure()).rootCause().isInstanceOf(BootstrapPropertyException.class);
		Throwable cause = context.getStartupFailure();
		while (!(cause instanceof BootstrapPropertyException)) {
			cause = cause.getCause();
		}
		return (BootstrapPropertyException) cause;
	}

}
