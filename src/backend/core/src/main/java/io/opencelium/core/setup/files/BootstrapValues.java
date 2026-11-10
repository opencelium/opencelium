package io.opencelium.core.setup.files;

import java.nio.file.Path;
import java.util.Objects;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.mongo.MongoConnection;

/**
 * The values the application needs before it can reach its database, as the wizard collected them: what
 * application.yml will say. The master key file joins when the wizard asks for it.
 *
 * @param dataDir  absolute
 * @param mongoUri the whole connection URI, which the env file holds and application.yml refers to
 */
public record BootstrapValues(DeploymentMode deploymentMode, Path dataDir, int port, String mongoUri) {

	public BootstrapValues {
		Objects.requireNonNull(deploymentMode, "deploymentMode");
		Objects.requireNonNull(dataDir, "dataDir");
		Objects.requireNonNull(mongoUri, "mongoUri");
		if (port < 1 || port > 65535) {
			throw new IllegalArgumentException("Port " + port + " is not between 1 and 65535.");
		}
	}

	/** Without the database password that the URI holds. */
	@Override
	public String toString() {
		return "BootstrapValues[deploymentMode=" + deploymentMode + ", dataDir=" + dataDir + ", port=" + port
				+ ", mongoUri=" + MongoConnection.redact(mongoUri) + "]";
	}

}
