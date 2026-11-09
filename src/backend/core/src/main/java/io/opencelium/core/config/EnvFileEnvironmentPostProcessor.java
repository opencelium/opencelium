package io.opencelium.core.config;

import java.nio.file.Path;
import java.util.Optional;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Environment;

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

	private final Path workingDir;

	public EnvFileEnvironmentPostProcessor() {
		this(Path.of("").toAbsolutePath());
	}

	EnvFileEnvironmentPostProcessor(Path workingDir) {
		this.workingDir = workingDir;
	}

	@Override
	public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	@Override
	public int getOrder() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/**
	 * Where the env file of this start is: next to the configuration file with the highest priority that Boot reads
	 * from a location, relative to the working directory of this process. The file need not exist. Empty when no
	 * configuration file is found.
	 */
	public static Optional<Path> envFile(Environment environment) {
		return envFile(environment, Path.of("").toAbsolutePath());
	}

	static Optional<Path> envFile(Environment environment, Path workingDir) {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
