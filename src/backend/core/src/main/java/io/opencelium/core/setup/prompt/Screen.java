package io.opencelium.core.setup.prompt;

import java.util.ArrayList;
import java.util.List;
import java.util.SequencedMap;

/**
 * Text helpers for the setup screens: the rule under a title, the framed box of the summary, and the tree list of
 * the files. The box is as wide as its longest row needs, at least {@link #MIN_BOX_WIDTH}, so a long path never
 * breaks the frame; its labels are padded to one column like the question labels.
 */
public final class Screen {

	/** The width of a rule: fits an 80-column terminal with room to spare. */
	static final int WIDTH = 76;

	/** The outer width of a box with short rows. */
	static final int MIN_BOX_WIDTH = 60;

	/** The column where a value starts after its label, in a question and in a box. */
	static final int LABEL_WIDTH = 16;

	private static final String INDENT = "   ";

	private static final String MARGIN = "  ";

	private Screen() {
	}

	public static String rule(Glyphs glyphs) {
		return glyphs.horizontal().repeat(WIDTH);
	}

	/** {@code label} padded to the label column, or followed by two spaces when it is longer. */
	static String padded(String label) {
		return label + " ".repeat(Math.max(LABEL_WIDTH - label.length(), 2));
	}

	/**
	 * The title in the top line, an empty line, one line for each row with the value after the padded label, an
	 * empty line, the bottom line.
	 */
	public static List<String> box(Glyphs glyphs, String title, SequencedMap<String, String> rows) {
		List<String> contents = rows.entrySet().stream()
				.map(row -> MARGIN + padded(row.getKey()) + row.getValue()).toList();
		int inner = Math.max(MIN_BOX_WIDTH - 2,
				contents.stream().mapToInt(String::length).max().orElse(0) + MARGIN.length());
		String head = glyphs.horizontal().repeat(2) + " " + title + " ";
		List<String> lines = new ArrayList<>();
		lines.add(glyphs.topLeft() + head + glyphs.horizontal().repeat(Math.max(0, inner - head.length()))
				+ glyphs.topRight());
		lines.add(glyphs.vertical() + " ".repeat(inner) + glyphs.vertical());
		for (String content : contents) {
			lines.add(glyphs.vertical() + content + " ".repeat(inner - content.length()) + glyphs.vertical());
		}
		lines.add(glyphs.vertical() + " ".repeat(inner) + glyphs.vertical());
		lines.add(glyphs.bottomLeft() + glyphs.horizontal().repeat(inner) + glyphs.bottomRight());
		return lines;
	}

	/** The title, then one line for each item with a branch mark; the last item closes the tree. */
	public static List<String> tree(Glyphs glyphs, String title, List<String> items) {
		List<String> lines = new ArrayList<>();
		lines.add(INDENT + title);
		for (int i = 0; i < items.size(); i++) {
			String mark = i == items.size() - 1 ? glyphs.lastBranch() : glyphs.branch();
			lines.add(INDENT + mark + " " + items.get(i));
		}
		return lines;
	}

}
