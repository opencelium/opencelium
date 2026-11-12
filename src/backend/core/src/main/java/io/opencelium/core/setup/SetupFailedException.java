package io.opencelium.core.setup;

import java.util.ArrayList;
import java.util.List;

/**
 * The setup cannot go on, and the process must end with the given exit code. A command line that cannot be
 * understood ends with {@link #USAGE_EXIT_CODE}; later failures (a missing value, a file that cannot be written)
 * bring their own codes. The message is meant for the terminal and never holds a secret. It keeps its lines apart,
 * so the terminal shows the line breaks of the wizard and never one that a quoted value brings.
 */
public final class SetupFailedException extends RuntimeException {

	/** The exit code of a command line that cannot be understood. */
	public static final int USAGE_EXIT_CODE = 2;

	/** The exit code of a setup that stops for another reason, for example a missing terminal or value. */
	public static final int FAILURE_EXIT_CODE = 1;

	private final List<String> lines;

	private final int exitCode;

	private SetupFailedException(List<String> lines, int exitCode) {
		super(String.join("\n", lines));
		this.lines = List.copyOf(lines);
		this.exitCode = exitCode;
	}

	static SetupFailedException usage(String message) {
		return new SetupFailedException(List.of(message), USAGE_EXIT_CODE);
	}

	/**
	 * A setup that stops with exit code 1: a missing or bad value, a setup file that cannot be read. Each argument is
	 * 1 line of the message; an empty one is an empty line.
	 */
	public static SetupFailedException failure(String line, String... more) {
		List<String> lines = new ArrayList<>(1 + more.length);
		lines.add(line);
		lines.addAll(List.of(more));
		return new SetupFailedException(lines, FAILURE_EXIT_CODE);
	}

	public int exitCode() {
		return exitCode;
	}

	/** The lines of the message, in order; {@link #getMessage()} is these lines joined with line feeds. */
	public List<String> lines() {
		return lines;
	}

}
