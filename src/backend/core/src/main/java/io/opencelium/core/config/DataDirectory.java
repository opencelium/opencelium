package io.opencelium.core.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * The data directory, guaranteed to exist and be writable. Obtain one through {@link #prepare(Path)}, which creates
 * the directory when missing; everything that stores local state (for example {@code master.key}) depends on this
 * bean rather than on the raw {@link OpenCeliumProperties#dataDir()} path.
 */
public final class DataDirectory {

	private final Path path;

	private DataDirectory(Path path) {
		this.path = path;
	}

	static DataDirectory prepare(Path dir) {
		try {
			Files.createDirectories(dir);
		}
		catch (IOException ex) {
			throw new BootstrapPropertyException(OpenCeliumProperties.DATA_DIR,
					"Data directory " + dir + " cannot be created: " + ex, ex);
		}
		if (!Files.isWritable(dir)) {
			throw new BootstrapPropertyException(OpenCeliumProperties.DATA_DIR,
					"Data directory " + dir + " is not writable by this user.");
		}
		return new DataDirectory(dir);
	}

	public Path path() {
		return path;
	}

	@Override
	public String toString() {
		return path.toString();
	}

}
