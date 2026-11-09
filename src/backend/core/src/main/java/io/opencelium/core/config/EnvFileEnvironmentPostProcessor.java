package io.opencelium.core.config;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Environment;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.env.SystemEnvironmentPropertySource;

/**
 * Gives the entries of the env file next to the configuration file to the application, so that a start by hand
 * needs no shell command to load the file first. The entries act as environment variables of the process, with the
 * same name rules ({@code SERVER_PORT} sets {@code server.port}), but a real variable of the process, a system
 * property and a start argument all take priority over them. Runs before the defaults, so a value from the file
 * counts as configured.
 */
public final class EnvFileEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

	/** The name of the env file, next to the configuration file. */
	public static final String FILE_NAME = "opencelium.env";

	/**
	 * The suffix makes Boot apply the environment-variable name rules to the entries, as for the process
	 * environment.
	 */
	public static final String PROPERTY_SOURCE_NAME = "openceliumEnvFile-systemEnvironment";

	/** The configuration file names that Boot reads in a directory location. */
	public static final List<String> CONFIGURATION_FILE_NAMES = List.of("application.yml", "application.yaml",
			"application.properties");

	private static final String LOCATION_PROPERTY = "spring.config.location";

	private static final String ADDITIONAL_LOCATION_PROPERTY = "spring.config.additional-location";

	/** Boot's own file locations, highest priority first; Boot also reads the classpath, which has no env file. */
	private static final List<String> DEFAULT_LOCATIONS = List.of("./config/", "./");

	private static final String OPTIONAL_PREFIX = "optional:";

	private static final String FILE_PREFIX = "file:";

	private static final String CLASSPATH_PREFIX = "classpath:";

	private final Path workingDir;

	public EnvFileEnvironmentPostProcessor() {
		this(Path.of("").toAbsolutePath());
	}

	EnvFileEnvironmentPostProcessor(Path workingDir) {
		this.workingDir = workingDir;
	}

	/**
	 * @throws EnvFileException when the env file exists but cannot be read, has a line in another form, or holds the
	 *                          master key
	 */
	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		Optional<Path> file = envFile(environment, workingDir).filter(Files::exists);
		if (file.isEmpty()) {
			return;
		}
		Map<String, Object> entries = new LinkedHashMap<>(EnvFileReader.read(file.get()));
		var source = new SystemEnvironmentPropertySource(PROPERTY_SOURCE_NAME, entries);
		MutablePropertySources sources = environment.getPropertySources();
		String processVariables = StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME;
		if (sources.contains(processVariables)) {
			sources.addAfter(processVariables, source);
		}
		else {
			sources.addLast(source);
		}
	}

	@Override
	public int getOrder() {
		// After the configuration files are loaded, so the env file cannot move them; before the defaults.
		return ConfigDataEnvironmentPostProcessor.ORDER + 1;
	}

	/**
	 * Where the env file of this start is: next to the configuration file with the highest priority that Boot reads
	 * from a location, relative to the working directory of this process. The file need not exist. Empty when no
	 * configuration file is found.
	 */
	public static Optional<Path> envFile(Environment environment) {
		return envFile(environment, Path.of("").toAbsolutePath());
	}

	/**
	 * As in Boot: {@code spring.config.additional-location} has the highest priority, also when
	 * {@code spring.config.location} is set; {@code spring.config.location} replaces Boot's own locations. In a list
	 * of locations the last one has the highest priority.
	 */
	static Optional<Path> envFile(Environment environment, Path workingDir) {
		Binder binder = Binder.get(environment);
		List<String> candidates = new ArrayList<>(locations(binder, ADDITIONAL_LOCATION_PROPERTY).reversed());
		List<String> named = locations(binder, LOCATION_PROPERTY);
		candidates.addAll(named.isEmpty() ? DEFAULT_LOCATIONS : named.reversed());
		for (String location : candidates) {
			Optional<Path> configuration = configurationFile(location, workingDir);
			if (configuration.isPresent()) {
				return Optional.of(configuration.get().resolveSibling(FILE_NAME));
			}
		}
		return Optional.empty();
	}

	private static List<String> locations(Binder binder, String property) {
		return binder.bind(property, String[].class).map(Arrays::asList).orElse(List.of()).stream()
				.map(String::strip).filter(location -> !location.isEmpty()).toList();
	}

	/**
	 * The configuration file of a location: the file itself, or in a directory location (it ends with {@code /} or
	 * the separator of this host, as in Boot) the first file name that exists. A classpath location or a pattern
	 * location gives none.
	 */
	private static Optional<Path> configurationFile(String location, Path workingDir) {
		String path = location.startsWith(OPTIONAL_PREFIX) ? location.substring(OPTIONAL_PREFIX.length()) : location;
		if (path.startsWith(CLASSPATH_PREFIX) || path.contains("*")) {
			return Optional.empty();
		}
		if (path.startsWith(FILE_PREFIX)) {
			path = path.substring(FILE_PREFIX.length());
		}
		Path resolved = workingDir.resolve(path).normalize();
		if (!path.endsWith("/") && !path.endsWith(File.separator)) {
			return Files.isRegularFile(resolved) ? Optional.of(resolved) : Optional.empty();
		}
		return CONFIGURATION_FILE_NAMES.stream().map(resolved::resolve).filter(Files::isRegularFile).findFirst();
	}

}
