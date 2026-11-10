package io.opencelium.core.setup;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

import io.opencelium.core.config.EnvFileEnvironmentPostProcessor;

/**
 * Where a configuration file is looked for before the wizard decision, and where the wizard writes its two files:
 * application.yml, which Boot reads, and the env file for the secrets application.yml refers to. The search
 * order is {@code ./config/}, {@code ./}, then the system directory ({@code /etc/opencelium}, on Linux and macOS
 * only), each with the three file names Spring Boot reads. The first two are Boot's own locations, relative to the
 * working directory and not to the jar, so a file found there is loaded by Boot on its own. Boot does not look in
 * the system directory, so a file found there has to be handed to Boot as an additional location.
 */
public final class ConfigLocations {

	/** Boot's own location under the working directory, also the wizard's write location. */
	static final String CONFIG_DIRECTORY = "config";

	static final Path SYSTEM_DIRECTORY = Path.of("/etc/opencelium");

	static final String YML_FILE_NAME = "application.yml";

	/** The name that the start looks for next to the configuration file. */
	static final String ENV_FILE_NAME = EnvFileEnvironmentPostProcessor.FILE_NAME;

	static final List<String> FILE_NAMES = EnvFileEnvironmentPostProcessor.CONFIGURATION_FILE_NAMES;

	private final Path workingDir;

	private final Optional<Path> systemDir;

	public ConfigLocations(Path workingDir, Path systemDir) {
		this(workingDir, Optional.of(Objects.requireNonNull(systemDir, "systemDir")));
	}

	private ConfigLocations(Path workingDir, Optional<Path> systemDir) {
		this.workingDir = Objects.requireNonNull(workingDir, "workingDir");
		this.systemDir = systemDir;
	}

	/** The working directory of this process, and {@code /etc/opencelium} on Linux and macOS. */
	public static ConfigLocations forThisHost() {
		return forHost(System.getProperty("os.name", ""), Path.of("").toAbsolutePath(), SYSTEM_DIRECTORY);
	}

	/**
	 * The locations of a host with the operating system {@code osName}: with the system directory on Linux and macOS
	 * only, where {@code /etc} belongs to root. On Windows {@code /etc/opencelium} is {@code <drive>:\etc\opencelium},
	 * a folder that any user can make in the root of the drive, so a file found there could come from another user.
	 * A Windows installation keeps its files in {@code ./config/} or names its own location.
	 */
	static ConfigLocations forHost(String osName, Path workingDir, Path systemDir) {
		String os = osName.toLowerCase(Locale.ROOT);
		boolean rootOwnedEtc = os.startsWith("linux") || os.startsWith("mac");
		return new ConfigLocations(workingDir, rootOwnedEtc ? Optional.of(systemDir) : Optional.empty());
	}

	/** The first configuration file in the search order. Only a regular file counts, not a directory of that name. */
	public Optional<Path> find() {
		List<Path> directories = new ArrayList<>(List.of(workingDir.resolve(CONFIG_DIRECTORY), workingDir));
		systemDir.ifPresent(directories::add);
		for (Path directory : directories) {
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
		return systemDir.map(file::startsWith).orElse(false);
	}

}
