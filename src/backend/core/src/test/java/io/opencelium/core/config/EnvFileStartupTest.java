package io.opencelium.core.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ConfigurableApplicationContext;

import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * A later start by hand: the process has no variable, application.yml and the env file are in a configuration
 * directory that Boot reads, and the start takes its values from the env file by itself. A bad line in the env file
 * stops the start with Boot's failure report, which names the file and the line and never the value.
 * <p>
 * A start that does not apply the env file never falls back to the documented default database: the placeholder
 * start then stops on its unresolved placeholder, and every other start names the database of this class.
 */
@ExtendWith({OutputCaptureExtension.class, LocalMongo.Cleanup.class})
class EnvFileStartupTest {

	@TempDir
	Path workingDir;

	@Test
	void applicationStartsWhenThePlaceholderValueIsOnlyInTheEnvFile() throws IOException {
		// The form the wizard writes: application.yml refers to a name, the env file holds the value. The test
		// server has no login, so the placeholder stands for the database instead of the password.
		String database = LocalMongo.databaseFor(EnvFileStartupTest.class);
		Path config = configuration("spring:\n  mongodb:\n    uri: '" + LocalMongo.uri("${OC_MONGO_DATABASE}") + "'\n",
				"# header\nOC_MONGO_DATABASE=" + database + "\n");

		try (ConfigurableApplicationContext context = CoreStartup.run(Map.of(), workingDir.resolve("data"),
				location(config))) {
			assertThat(context.getEnvironment().getProperty(BootstrapProperties.MONGODB_URI))
					.isEqualTo(LocalMongo.uri(database));
		}
	}

	@Test
	void applicationStartsWhenTheMongoUriIsOnlyInTheEnvFile(CapturedOutput output) throws IOException {
		String uri = LocalMongo.uriFor(EnvFileStartupTest.class);
		Path config = configuration("", "# header\nSPRING_MONGODB_URI=" + quoted(uri) + "\n");

		try (ConfigurableApplicationContext context = CoreStartup.run(Map.of(), workingDir.resolve("data"),
				location(config), database())) {
			assertThat(context.getEnvironment().getProperty(BootstrapProperties.MONGODB_URI)).isEqualTo(uri);
		}
		// The env file runs before the defaults, so the URI counts as configured and gets no (default) line.
		assertThat(output).doesNotContain(BootstrapProperties.MONGODB_URI + " = ").contains("MongoDB ping ok");
	}

	@Test
	void applicationStopsNamingTheLineWhenTheEnvFileHasABadLine(CapturedOutput output) throws IOException {
		Path config = configuration("", "# header\nexport OC_X=p4ssword\n");
		Path envFile = config.resolve("opencelium.env");

		assertThatThrownBy(() -> CoreStartup.run(Map.of(), workingDir.resolve("data"), location(config), database())
				.close()).isInstanceOf(EnvFileException.class);
		assertThat(output).contains("APPLICATION FAILED TO START").contains(envFile + ", line 2")
				.doesNotContain("p4ssword");
	}

	private Path configuration(String yml, String envContent) throws IOException {
		Path config = Files.createDirectories(workingDir.resolve("config"));
		Files.writeString(config.resolve("application.yml"), "opencelium:\n  deployment-mode: self-host\n" + yml);
		Files.writeString(config.resolve("opencelium.env"), envContent);
		return config;
	}

	/** Boot reads {@code ./config/} next to the jar; here the temporary directory takes that place. */
	private static String location(Path config) {
		return "--spring.config.additional-location=optional:file:" + config + "/";
	}

	private static String database() {
		return CoreStartup.arg(BootstrapProperties.MONGODB_DATABASE, LocalMongo.databaseFor(EnvFileStartupTest.class));
	}

	/**
	 * The written form of a value in double quotes, because the URI of a test server can hold {@code ?} and a login.
	 * The renderer of the wizard is in a package above this one, so the test writes the form itself.
	 */
	private static String quoted(String value) {
		return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("$", "\\$").replace("`", "\\`")
				+ "\"";
	}

}
