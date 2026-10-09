package io.opencelium.core.setup;

/**
 * The setup cannot go on, and the process must end with the given exit code. A command line that cannot be
 * understood ends with {@link #USAGE_EXIT_CODE}; later failures (a missing answer, a file that cannot be written)
 * bring their own codes. The message is meant for the terminal and never holds a secret.
 */
public final class SetupFailedException extends RuntimeException {

	/** The exit code of a command line that cannot be understood. */
	public static final int USAGE_EXIT_CODE = 2;

	private final int exitCode;

	public SetupFailedException(String message, int exitCode) {
		super(message);
		this.exitCode = exitCode;
	}

	static SetupFailedException usage(String message) {
		return new SetupFailedException(message, USAGE_EXIT_CODE);
	}

	public int exitCode() {
		return exitCode;
	}

}
