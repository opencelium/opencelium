package io.opencelium.core.setup.prompt;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import io.opencelium.core.setup.SetupCancelledException;

/**
 * The questions the setup wizard asks and the text it prints, apart from where they go: the console in
 * production, a script in tests. Every question accepts {@code ?} for help and {@code q} to cancel the setup.
 * A masked password question joins with the first step that asks it.
 */
public interface Prompter {

	/**
	 * A numbered list; the user types a number and Enter, or only Enter for the default.
	 *
	 * @return the index of the chosen option in {@code options}
	 * @throws SetupCancelledException when the user types {@code q} or the input ends
	 */
	int choice(String question, List<Choice> options, int defaultIndex);

	/**
	 * A free text with the default shown in brackets; Enter takes the default. The validator returns the message to
	 * print when a value is not acceptable, the default included, and the question is asked again.
	 *
	 * @return the accepted value, without surrounding whitespace
	 * @throws SetupCancelledException when the user types {@code q} or the input ends
	 */
	String text(String question, String help, String defaultValue, Function<String, Optional<String>> validator);

	/**
	 * A yes/no question with the default shown as {@code [Y/n]} or {@code [y/N]}; Enter takes the default.
	 *
	 * @throws SetupCancelledException when the user types {@code q} or the input ends
	 */
	boolean yesNo(String question, String help, boolean defaultYes);

	/** Prints one line as it is; the caller indents it. */
	void print(String line);

}
