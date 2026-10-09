package io.opencelium.core.setup.prompt;

import java.util.List;
import java.util.Optional;
import java.util.SequencedMap;
import java.util.function.Function;

import io.opencelium.core.setup.SetupCancelledException;

/**
 * The questions the setup wizard asks and the screens it shows, apart from where they go: the console in
 * production, a script in tests. Every question accepts {@code ?} for help and {@code q} to cancel the setup.
 * The display methods carry the kind of a line (a title, a status, a box, a list), so the steps never know a
 * mark or a frame; the implementation draws them. A masked password question joins with the first step that asks
 * it.
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

	/** The title line of a screen, with a rule under it. */
	void title(String title);

	/** A status line that informs; continuation lines are indented under it. */
	void info(String line, String... continuation);

	/** A status line about something that failed; continuation lines are indented under it. */
	void error(String line, String... continuation);

	/** A status line about something that is done. */
	void success(String line);

	/** A status line about something that starts now. */
	void progress(String line);

	/** A framed box with a title and one row for each entry: the label, then the value aligned. */
	void box(String title, SequencedMap<String, String> rows);

	/** A titled list of items. */
	void list(String title, List<String> items);

	/** Prints one line as it is; the caller indents it. */
	void print(String line);

}
