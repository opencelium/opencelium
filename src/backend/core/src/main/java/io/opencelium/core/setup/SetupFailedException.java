package io.opencelium.core.setup;

/**
 * The setup cannot go on, and the process must end with the given exit code. A command line that cannot be
 * understood ends with {@link #USAGE_EXIT_CODE}; later failures (a missing answer, a file that cannot be written)
 * bring their own codes. The message is meant for the terminal and never holds a secret.
 */
public final class SetupFailedException extends RuntimeException {

	/** The exit code of a command line that cannot be understood. */
	public static final int USAGE_EXIT_CODE = 2;

	/** The exit code of a setup that stops for another reason, for example a missing terminal or answer. */
	public static final int FAILURE_EXIT_CODE = 1;

	private final int exitCode;

	public SetupFailedException(String message, int exitCode) {
		super(message);
		this.exitCode = exitCode;
	}

	static SetupFailedException usage(String message) {
		return new SetupFailedException(message, USAGE_EXIT_CODE);
	}

	/** A setup that stops with exit code 1: a missing or bad answer, an answers file that cannot be read. */
	public static SetupFailedException failure(String message) {
		return new SetupFailedException(message, FAILURE_EXIT_CODE);
	}

	public int exitCode() {
		return exitCode;
	}

}
