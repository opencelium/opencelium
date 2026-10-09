package io.opencelium.core.setup;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Where a configuration file is looked for before the wizard decision, and where the wizard writes its two files:
 * application.yml, which Boot reads, and the env file for the secrets application.yml refers to. The search
 * order is {@code ./config/}, {@code ./}, then the system directory ({@code /etc/opencelium}), each with the three
 * file names Spring Boot reads. The first two are Boot's own locations, relative to the working directory and not
 * to the jar, so a file found there is loaded by Boot on its own. Boot does not look in the system directory, so a
 * file found there has to be handed to Boot as an additional location.
 */
public final class ConfigLocations {

	/** Boot's own location under the working directory, also the wizard's write location. */
	static final String CONFIG_DIRECTORY = "config";

	static final Path SYSTEM_DIRECTORY = Path.of("/etc/opencelium");

	static final String YML_FILE_NAME = "application.yml";

	static final String ENV_FILE_NAME = "opencelium.env";

	static final List<String> FILE_NAMES = List.of(YML_FILE_NAME, "application.yaml", "application.properties");

	private final Path workingDir;

	private final Path systemDir;

	public ConfigLocations(Path workingDir, Path systemDir) {
		this.workingDir = Objects.requireNonNull(workingDir, "workingDir");
		this.systemDir = Objects.requireNonNull(systemDir, "systemDir");
	}

	/** The working directory of this process and {@code /etc/opencelium}. */
	public static ConfigLocations forThisHost() {
		return new ConfigLocations(Path.of("").toAbsolutePath(), SYSTEM_DIRECTORY);
	}

	/** The first configuration file in the search order. Only a regular file counts, not a directory of that name. */
	public Optional<Path> find() {
		for (Path directory : List.of(workingDir.resolve(CONFIG_DIRECTORY), workingDir, systemDir)) {
			for (String name : FILE_NAMES) {
				Path file = directory.resolve(name);
				if (Files.isRegularFile(file)) {
					return Optional.of(file);
				}
			}
		}
		return Optional.empty();
	}

	/** Where the wizard writes its files: {@code <working directory>/config/}. */
	public Path writeDirectory() {
		return workingDir.resolve(CONFIG_DIRECTORY);
	}

	/** The configuration file the wizard writes, the first name of the search order, so a later start finds it. */
	public Path ymlFile() {
		return writeDirectory().resolve(YML_FILE_NAME);
	}

	/** The env file the wizard writes next to application.yml. */
	public Path envFile() {
		return writeDirectory().resolve(ENV_FILE_NAME);
	}

	/** Whether {@code file} is under the system directory, which Boot does not read by itself. */
	public boolean isSystemLocation(Path file) {
		return file.startsWith(systemDir);
	}

}
