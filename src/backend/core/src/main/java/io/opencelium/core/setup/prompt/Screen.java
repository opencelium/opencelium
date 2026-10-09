package io.opencelium.core.setup.prompt;

import java.util.List;
import java.util.SequencedMap;

/**
 * Text helpers for the setup screens: the section rule that opens a screen, and the two-column table of the
 * summary. The rule starts at the margin; table lines are indented by 2 like the questions.
 */
public final class Screen {

	/** The width of a section rule: fits an 80-column terminal with room to spare. */
	static final int WIDTH = 76;

	private static final String INDENT = "  ";

	private Screen() {
	}

	/** {@code ── Title ────…}, filled to {@link #WIDTH}; a longer title is not cut. */
	public static String section(String title) {
		String head = "── " + title + " ";
		return head + "─".repeat(Math.max(0, WIDTH - head.length()));
	}

	/** One line for each row: the label padded to the longest label, 2 spaces, the value. */
	public static List<String> table(SequencedMap<String, String> rows) {
		int width = rows.keySet().stream().mapToInt(String::length).max().orElse(0);
		return rows.entrySet().stream()
				.map(row -> INDENT + row.getKey() + " ".repeat(width - row.getKey().length() + 2) + row.getValue())
				.toList();
	}

}
