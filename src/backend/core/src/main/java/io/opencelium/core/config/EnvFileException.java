package io.opencelium.core.config;

import java.nio.file.Path;
import java.util.Optional;

/**
 * An env file the operator must fix: a line in a form the start does not read, a key that must not be in the file,
 * or a file that cannot be read. Stops the application; the message names the file and the line, and never a value,
 * because the file holds secrets.
 */
public final class EnvFileException extends RuntimeException {

	/**
	 * @param line    the 1-based line number, or 0 when the whole file is the problem
	 * @param problem what is wrong, without the value of the line
	 * @param action  what the operator does to repair it
	 */
	public EnvFileException(Path file, int line, String problem, String action) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	public Path file() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** The 1-based line number; empty when the whole file is the problem. */
	public Optional<Integer> line() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	public String action() {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
