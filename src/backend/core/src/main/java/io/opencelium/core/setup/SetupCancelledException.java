package io.opencelium.core.setup;

/**
 * The user ended the setup before the summary: {@code q} at a question, the end of the input, or Ctrl+C. The
 * wizard prints the message, writes nothing, and exits with code 0, because a cancel is a choice, not a failure.
 */
public final class SetupCancelledException extends RuntimeException {

	public static final String MESSAGE = "Setup cancelled. Nothing was written.";

	public SetupCancelledException() {
		super(MESSAGE);
	}

}
