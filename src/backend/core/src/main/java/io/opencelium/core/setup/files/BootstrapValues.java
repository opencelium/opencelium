package io.opencelium.core.setup.files;

import java.nio.file.Path;
import java.util.Objects;

import io.opencelium.core.config.DeploymentMode;

/**
 * The values the application needs before it can reach its database, as the wizard collected them: what
 * application.yml will say. The MongoDB settings and the master key file join when the wizard asks for them.
 *
 * @param dataDir absolute
 */
public record BootstrapValues(DeploymentMode deploymentMode, Path dataDir, int port) {

	public BootstrapValues {
		Objects.requireNonNull(deploymentMode, "deploymentMode");
		Objects.requireNonNull(dataDir, "dataDir");
		if (port < 1 || port > 65535) {
			throw new IllegalArgumentException("Port " + port + " is not between 1 and 65535.");
		}
	}

}
