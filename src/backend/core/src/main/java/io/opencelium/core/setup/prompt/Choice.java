package io.opencelium.core.setup.prompt;

import java.util.Objects;

/**
 * One option of a numbered choice.
 *
 * @param label   the short name after the number, for example "Self-host"
 * @param summary a few words next to the label
 * @param help    the longer explanation printed when the user types {@code ?}; line breaks are kept
 */
public record Choice(String label, String summary, String help) {

	public Choice {
		Objects.requireNonNull(label, "label");
		Objects.requireNonNull(summary, "summary");
		Objects.requireNonNull(help, "help");
	}

}
