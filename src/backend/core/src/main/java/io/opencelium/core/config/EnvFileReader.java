package io.opencelium.core.config;

import java.nio.file.Path;
import java.util.SequencedMap;

/**
 * Reads the env file that the setup wizard writes next to application.yml: the secrets that application.yml refers
 * to by name, for example the MongoDB password. It reads exactly the form the wizard writes, the form that POSIX sh
 * and systemd's {@code EnvironmentFile} read the same way, and stops on anything else, so that no value is read
 * differently from what the operator sees in the file.
 */
public final class EnvFileReader {

	private EnvFileReader() {
	}

	/**
	 * The entries of the file, in the order of their lines.
	 *
	 * @throws EnvFileException when the file cannot be read, when a line is not in the written form, or when the file
	 *                          holds the master key
	 */
	public static SequencedMap<String, String> read(Path file) {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
