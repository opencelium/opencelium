package io.opencelium.core.setup.prompt;

import java.util.ArrayList;
import java.util.List;
import java.util.SequencedMap;

/**
 * Text helpers for the setup screens: the rule under a title, the framed box of the summary, and the list of the
 * files. Only characters that every terminal, charset and font draws the same way: {@code - | +} and spaces. Each
 * line starts in the margin of 2. The box is as wide as its longest row needs, at least the width of the rule, so a
 * long path never breaks the frame; its labels are padded to one column like the question labels.
 */
public final class Screen {

	/** The width of a line with its margin: fits an 80-column terminal with room to spare. */
	static final int WIDTH = 76;

	/** The column where a value starts after its label, in a question and in a box. */
	static final int LABEL_WIDTH = 16;

	static final String MARGIN = "  ";

	private static final String RULE_CHAR = "-";

	private static final String BULLET = "- ";

	private Screen() {
	}

	public static String rule() {
		return MARGIN + RULE_CHAR.repeat(WIDTH - MARGIN.length());
	}

	/** {@code label} padded to the label column, or followed by one space when it is longer. */
	static String padded(String label) {
		return label + " ".repeat(Math.max(LABEL_WIDTH - label.length(), 1));
	}

	/**
	 * The title in the top line, an empty line, one line for each row with the value after the padded label, an
	 * empty line, the bottom line.
	 */
	public static List<String> box(String title, SequencedMap<String, String> rows) {
		List<String> contents = rows.entrySet().stream()
				.map(row -> MARGIN + padded(row.getKey()) + row.getValue()).toList();
		int inner = Math.max(WIDTH - MARGIN.length() - 2,
				contents.stream().mapToInt(String::length).max().orElse(0) + MARGIN.length());
		String head = RULE_CHAR.repeat(2) + " " + title + " ";
		List<String> lines = new ArrayList<>();
		lines.add(MARGIN + "+" + head + RULE_CHAR.repeat(Math.max(0, inner - head.length())) + "+");
		lines.add(MARGIN + "|" + " ".repeat(inner) + "|");
		for (String content : contents) {
			lines.add(MARGIN + "|" + content + " ".repeat(inner - content.length()) + "|");
		}
		lines.add(MARGIN + "|" + " ".repeat(inner) + "|");
		lines.add(MARGIN + "+" + RULE_CHAR.repeat(inner) + "+");
		return lines;
	}

	/** The title in the margin, then one bulleted line for each item, indented under the title. */
	public static List<String> list(String title, List<String> items) {
		List<String> lines = new ArrayList<>();
		lines.add(MARGIN + title);
		for (String item : items) {
			lines.add(MARGIN + MARGIN + BULLET + item);
		}
		return lines;
	}

}
