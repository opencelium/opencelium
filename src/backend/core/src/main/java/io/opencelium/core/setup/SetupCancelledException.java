package io.opencelium.core.setup;

/**
 * The user ended the setup: {@code q} at a question, the end of the input, or Ctrl+C. Before the summary nothing is
 * written yet; at a question after the write, for example the backup question of the master key, the file plan rolls
 * the files back. The wizard prints the message and exits with code 0, because a cancel is a choice, not a failure.
 */
public final class SetupCancelledException extends RuntimeException {

	public static final String MESSAGE = "Setup cancelled. Nothing was written.";

	public SetupCancelledException() {
		super(MESSAGE);
	}

}
