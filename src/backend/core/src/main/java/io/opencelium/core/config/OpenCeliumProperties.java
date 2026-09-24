package io.opencelium.core.config;

import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;

import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.Environment;

/**
 * Bootstrap settings from application.yml: the few values needed before the database is reachable.
 * <p>
 * Bound and validated by hand rather than with {@code @ConfigurationProperties}, so every problem stops startup
 * with a {@link BootstrapPropertyException} that names the property. Defaults are never applied here; they come
 * from {@link DefaultsEnvironmentPostProcessor}, which also logs them. Parsing has no side effects: the data
 * directory is created by {@link DataDirectory}.
 *
 * @param deploymentMode {@code opencelium.deployment-mode}
 * @param dataDir        {@code opencelium.data-dir}, absolute; either missing or a directory
 * @param masterKeyFile  {@code opencelium.master-key-file}, absolute; existence is checked by the key resolver
 */
public record OpenCeliumProperties(DeploymentMode deploymentMode, Path dataDir, Optional<Path> masterKeyFile) {

	public static final String DEPLOYMENT_MODE = "opencelium.deployment-mode";

	public static final String DATA_DIR = "opencelium.data-dir";

	public static final String MASTER_KEY_FILE = "opencelium.master-key-file";

	public OpenCeliumProperties {
		Objects.requireNonNull(deploymentMode, "deploymentMode");
		Objects.requireNonNull(dataDir, "dataDir");
		Objects.requireNonNull(masterKeyFile, "masterKeyFile");
	}

	static OpenCeliumProperties from(Environment environment) {
		Binder binder = Binder.get(environment);
		return new OpenCeliumProperties(deploymentMode(binder), dataDir(binder), masterKeyFile(binder));
	}

	private static DeploymentMode deploymentMode(Binder binder) {
		String value = required(binder, DEPLOYMENT_MODE);
		return DeploymentMode.parse(value).orElseThrow(() -> new BootstrapPropertyException(DEPLOYMENT_MODE,
				"'" + value + "' is not a deployment mode. Allowed values: " + DeploymentMode.allowedValues() + "."));
	}

	private static Path dataDir(Binder binder) {
		Path dir = path(DATA_DIR, required(binder, DATA_DIR));
		if (Files.exists(dir) && !Files.isDirectory(dir)) {
			throw new BootstrapPropertyException(DATA_DIR, "Data directory " + dir + " is not a directory.");
		}
		return dir;
	}

	private static Optional<Path> masterKeyFile(Binder binder) {
		return BootstrapProperties.read(binder, MASTER_KEY_FILE).map(value -> path(MASTER_KEY_FILE, value));
	}

	private static String required(Binder binder, String name) {
		return BootstrapProperties.read(binder, name).orElseThrow(() -> new BootstrapPropertyException(name,
				name + " is not set and no default was applied."));
	}

	private static Path path(String name, String value) {
		try {
			return Path.of(value).toAbsolutePath().normalize();
		}
		catch (InvalidPathException ex) {
			throw new BootstrapPropertyException(name, "'" + value + "' is not a valid path: " + ex.getReason(), ex);
		}
	}

}
