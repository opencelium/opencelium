package io.opencelium.core.setup.prompt;

import java.util.List;

import io.opencelium.core.setup.SetupCancelledException;

/**
 * The questions the setup wizard asks and the text it prints, apart from where they go: the console in
 * production, a script in tests. Every question accepts {@code ?} for help and {@code q} to cancel the setup.
 * Further question types (a text with a default, yes/no) join with the first step that asks them.
 */
public interface Prompter {

	/**
	 * A numbered list; the user types a number and Enter, or only Enter for the default.
	 *
	 * @return the index of the chosen option in {@code options}
	 * @throws SetupCancelledException when the user types {@code q} or the input ends
	 */
	int choice(String question, List<Choice> options, int defaultIndex);

	/** Prints one line as it is; the caller indents it. */
	void print(String line);

}
