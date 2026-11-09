package io.opencelium.core.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The start reads the env file next to the configuration file that Boot reads, so a start by hand needs no shell
 * command first. The entries act as environment variables below the real ones: a variable of the process wins, and
 * the environment-variable name rules apply. The configuration file is the one with the highest priority at a
 * location: {@code spring.config.additional-location} first, then {@code spring.config.location} when it is set,
 * else {@code ./config/} and {@code ./}. A file that {@code spring.config.import} brings in does not count.
 * <p>
 * The environment here is built by hand: the process variables are a fixed map, the arguments and the loaded yml
 * file are map sources, so nothing of the developer's machine takes part.
 */
class EnvFileEnvironmentPostProcessorTest {

	private static final String URI_WITH_PLACEHOLDER = "mongodb://oc:${OC_MONGO_PASSWORD}@db.example/opencelium";

	@TempDir
	Path tmp;

	private final Map<String, Object> processVariables = new HashMap<>();

	private final Map<String, Object> arguments = new LinkedHashMap<>();

	private final Map<String, Object> yml = new LinkedHashMap<>();

	@Test
	void postProcessAddsTheEntriesWhenAnEnvFileIsNextToTheConfiguration() throws IOException {
		Path config = configuration("config", "OC_MONGO_PASSWORD=s3cret\n");
		arguments.put("spring.config.additional-location", "optional:file:" + config + "/");
		yml.put("spring.mongodb.uri", URI_WITH_PLACEHOLDER);

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("spring.mongodb.uri"))
				.isEqualTo("mongodb://oc:s3cret@db.example/opencelium");
		assertThat(names(environment)).containsSubsequence(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
				EnvFileEnvironmentPostProcessor.PROPERTY_SOURCE_NAME, "yml");
		assertThat(EnvFileEnvironmentPostProcessor.envFile(environment, workingDir()))
				.contains(config.resolve("opencelium.env"));
	}

	@Test
	void postProcessAddsNothingWhenNoEnvFileExists() throws IOException {
		Path config = configuration("config", null);
		arguments.put("spring.config.additional-location", "optional:file:" + config + "/");
		StandardEnvironment untouched = environment();

		StandardEnvironment environment = postProcess();

		assertThat(names(environment)).isEqualTo(names(untouched));
		assertThat(EnvFileEnvironmentPostProcessor.envFile(environment, workingDir()))
				.contains(config.resolve("opencelium.env"));
	}

	@Test
	void postProcessKeepsTheEnvironmentValueWhenTheFileHasTheSameVariable() throws IOException {
		Path config = configuration("config", "OC_MONGO_PASSWORD=from-file\n");
		arguments.put("spring.config.additional-location", "optional:file:" + config + "/");
		processVariables.put("OC_MONGO_PASSWORD", "from-process");

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isEqualTo("from-process");
	}

	@Test
	void postProcessSetsServerPortWhenTheFileHasServerPort() throws IOException {
		Path config = configuration("config", "SERVER_PORT=9191\nSPRING_MONGODB_URI=mongodb://db.example/oc\n");
		arguments.put("spring.config.additional-location", "optional:file:" + config + "/");

		Binder binder = Binder.get(postProcess());

		assertThat(binder.bind("server.port", Integer.class).get()).isEqualTo(9191);
		assertThat(binder.bind("spring.mongodb.uri", String.class).get()).isEqualTo("mongodb://db.example/oc");
	}

	@Test
	void postProcessReadsTheEnvFileOfTheWorkingDirectoryWhenNoLocationIsSet() throws IOException {
		configuration("work/config", "OC_MONGO_PASSWORD=s3cret\n");

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isEqualTo("s3cret");
	}

	@Test
	void postProcessPrefersTheAdditionalLocationWhenTheWorkingDirectoryAlsoHasAConfiguration() throws IOException {
		configuration("work/config", "OC_MONGO_PASSWORD=from-working-directory\n");
		Path system = configuration("etc/opencelium", "OC_MONGO_PASSWORD=from-additional-location\n");
		arguments.put("spring.config.additional-location", "optional:file:" + system + "/");

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isEqualTo("from-additional-location");
	}

	@Test
	void postProcessPrefersTheAdditionalLocationWhenSpringConfigLocationIsAlsoSet() throws IOException {
		// Boot reads the additional location also when spring.config.location replaces its own locations, and above it.
		Path named = configuration("srv/oc", "OC_MONGO_PASSWORD=from-named-location\n");
		Path additional = configuration("srv/override", "OC_MONGO_PASSWORD=from-additional-location\n");
		arguments.put("spring.config.location", named + "/");
		arguments.put("spring.config.additional-location", "optional:file:" + additional + "/");

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isEqualTo("from-additional-location");
	}

	@Test
	void postProcessReadsTheEnvFileNextToTheNamedFileWhenSpringConfigLocationIsSet() throws IOException {
		configuration("work/config", "OC_MONGO_PASSWORD=from-working-directory\n");
		Path named = Files.createDirectories(tmp.resolve("srv/oc"));
		Files.writeString(named.resolve("custom.yml"), "");
		Files.writeString(named.resolve("opencelium.env"), "OC_MONGO_PASSWORD=from-named-location\n");
		arguments.put("spring.config.location", "file:" + named.resolve("custom.yml"));

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isEqualTo("from-named-location");
	}

	@Test
	void postProcessReadsTheEnvFileOfTheNamedDirectoryWhenSpringConfigLocationIsADirectory() throws IOException {
		configuration("work/config", "OC_MONGO_PASSWORD=from-working-directory\n");
		Path named = configuration("srv/oc", "OC_MONGO_PASSWORD=from-named-directory\n");
		arguments.put("spring.config.location", named + "/");

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isEqualTo("from-named-directory");
	}

	@Test
	void postProcessReadsTheEnvFileNextToApplicationPropertiesWhenTheDirectoryHasNoYml() throws IOException {
		Path config = Files.createDirectories(tmp.resolve("work/config"));
		Files.writeString(config.resolve("application.properties"), "");
		Files.writeString(config.resolve("opencelium.env"), "OC_MONGO_PASSWORD=s3cret\n");

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isEqualTo("s3cret");
	}

	@Test
	void postProcessReadsNothingNextToAnImportedFileWhenNoLocationHasAConfiguration() throws IOException {
		Path imported = configuration("imported", "OC_MONGO_PASSWORD=from-import\n");
		arguments.put("spring.config.import", "file:" + imported.resolve("application.yml"));

		StandardEnvironment environment = postProcess();

		assertThat(environment.getProperty("OC_MONGO_PASSWORD")).isNull();
		assertThat(EnvFileEnvironmentPostProcessor.envFile(environment, workingDir())).isEmpty();
	}

	/** Makes {@code application.yml} in {@code relative}, and the env file there unless {@code envContent} is null. */
	private Path configuration(String relative, String envContent) throws IOException {
		Path directory = Files.createDirectories(tmp.resolve(relative));
		Files.writeString(directory.resolve("application.yml"), "");
		if (envContent != null) {
			Files.writeString(directory.resolve("opencelium.env"), envContent);
		}
		return directory;
	}

	private Path workingDir() {
		return tmp.resolve("work");
	}

	private StandardEnvironment postProcess() {
		StandardEnvironment environment = environment();
		new EnvFileEnvironmentPostProcessor(workingDir()).postProcessEnvironment(environment, new SpringApplication());
		return environment;
	}

	/** The arguments first, then the process (no system properties of this JVM), then the loaded yml file. */
	private StandardEnvironment environment() {
		var environment = new StandardEnvironment();
		var sources = environment.getPropertySources();
		sources.replace(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME,
				new MapPropertySource(StandardEnvironment.SYSTEM_PROPERTIES_PROPERTY_SOURCE_NAME, Map.of()));
		sources.replace(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, new SystemEnvironmentPropertySource(
				StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, processVariables));
		sources.addFirst(new MapPropertySource("commandLineArgs", arguments));
		sources.addLast(new MapPropertySource("yml", yml));
		return environment;
	}

	private static List<String> names(StandardEnvironment environment) {
		return environment.getPropertySources().stream().map(PropertySource::getName).toList();
	}

}
