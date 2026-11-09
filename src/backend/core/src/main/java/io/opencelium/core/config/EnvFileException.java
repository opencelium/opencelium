package io.opencelium.core.config;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;

/**
 * An env file the operator must fix: a line in a form the start does not read, a key that must not be in the file,
 * or a file that cannot be read. Stops the application; the message names the file and the line, and never a value,
 * because the file holds secrets.
 */
public final class EnvFileException extends RuntimeException {

	private final Path file;

	private final int line;

	private final String action;

	/**
	 * @param line    the 1-based line number, or 0 when the whole file is the problem
	 * @param problem what is wrong, without the value of the line
	 * @param action  what the operator does to repair it
	 */
	public EnvFileException(Path file, int line, String problem, String action) {
		super(location(file, line) + ": " + problem);
		this.file = Objects.requireNonNull(file, "file");
		this.line = line;
		this.action = Objects.requireNonNull(action, "action");
	}

	public Path file() {
		return file;
	}

	/** The 1-based line number; empty when the whole file is the problem. */
	public Optional<Integer> line() {
		return line > 0 ? Optional.of(line) : Optional.empty();
	}

	public String action() {
		return action;
	}

	private static String location(Path file, int line) {
		return line > 0 ? file + ", line " + line : file.toString();
	}

}
