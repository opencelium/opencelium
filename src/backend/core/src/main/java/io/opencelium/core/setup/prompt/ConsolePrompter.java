package io.opencelium.core.setup.prompt;

import java.io.PrintWriter;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.SequencedMap;
import java.util.function.Function;

import io.opencelium.core.setup.SetupCancelledException;

/**
 * Asks on a console. Bad input is explained and the question is asked again, so a typo never ends the wizard;
 * only {@code q} and the end of the input do. The layout: a question starts with {@code ?}, its label is padded
 * to one column, the default is in brackets, then the prompt mark; a status line starts with its symbol in a
 * column of 3; help and continuation lines are indented under that column. The symbols follow the console
 * charset, see {@link Glyphs}.
 */
public final class ConsolePrompter implements Prompter {

	static final String CANCEL = "q";

	static final String HELP = "?";

	private static final String QUESTION = "?";

	/** The width of the symbol column: a symbol of 1 or 2 characters, then at least 1 space. */
	private static final int SYMBOL_WIDTH = 3;

	private static final String INDENT = " ".repeat(SYMBOL_WIDTH);

	private static final String MARGIN = "  ";

	private final ConsoleIo console;

	private final Glyphs glyphs;

	public ConsolePrompter(ConsoleIo console) {
		this.console = Objects.requireNonNull(console, "console");
		this.glyphs = Glyphs.forCharset(console.charset());
	}

	@Override
	public int choice(String question, List<Choice> options, int defaultIndex) {
		if (options.isEmpty() || defaultIndex < 0 || defaultIndex >= options.size()) {
			throw new IllegalArgumentException("The default " + defaultIndex + " is not one of " + options.size()
					+ " options.");
		}
		PrintWriter out = console.writer();
		out.println();
		out.println(column(QUESTION) + question);
		int width = options.stream().mapToInt(option -> option.label().length()).max().orElseThrow();
		for (int i = 0; i < options.size(); i++) {
			Choice option = options.get(i);
			out.println(INDENT + (i + 1) + ") " + option.label()
					+ " ".repeat(width - option.label().length() + 4) + option.summary());
		}
		while (true) {
			String input = ask(INDENT + "Choice [" + (defaultIndex + 1) + "] " + glyphs.prompt() + " ");
			if (input.isEmpty()) {
				return defaultIndex;
			}
			if (input.equals(HELP)) {
				for (int i = 0; i < options.size(); i++) {
					printIndented((i + 1) + ") " + options.get(i).label() + ": " + options.get(i).help());
				}
				continue;
			}
			try {
				int number = Integer.parseInt(input);
				if (number >= 1 && number <= options.size()) {
					return number - 1;
				}
			}
			catch (NumberFormatException ex) {
				// Not a number: the same message as a number out of range.
			}
			out.println(column(glyphs.error()) + "Please enter a number between 1 and " + options.size() + ".");
		}
	}

	@Override
	public String text(String question, String help, String defaultValue,
			Function<String, Optional<String>> validator) {
		PrintWriter out = console.writer();
		while (true) {
			String input = ask(questionLine(question, "[" + defaultValue + "]"));
			if (input.equals(HELP)) {
				printIndented(help);
				continue;
			}
			String value = input.isEmpty() ? defaultValue : input;
			Optional<String> problem = validator.apply(value);
			if (problem.isEmpty()) {
				return value;
			}
			out.println(column(glyphs.error()) + problem.get());
		}
	}

	@Override
	public boolean yesNo(String question, String help, boolean defaultYes) {
		PrintWriter out = console.writer();
		while (true) {
			String input = ask(questionLine(question, defaultYes ? "[Y/n]" : "[y/N]"));
			if (input.isEmpty()) {
				return defaultYes;
			}
			if (input.equals(HELP)) {
				printIndented(help);
				continue;
			}
			switch (input.toLowerCase(Locale.ROOT)) {
				case "y", "yes" -> {
					return true;
				}
				case "n", "no" -> {
					return false;
				}
				default -> out.println(column(glyphs.error()) + "Please answer y or n.");
			}
		}
	}

	@Override
	public void title(String title) {
		PrintWriter out = console.writer();
		out.println(MARGIN + title);
		out.println(Screen.rule(glyphs));
		out.flush();
	}

	@Override
	public void info(String line, String... continuation) {
		status(glyphs.info(), line, continuation);
	}

	@Override
	public void error(String line, String... continuation) {
		status(glyphs.error(), line, continuation);
	}

	@Override
	public void success(String line) {
		status(glyphs.success(), line);
	}

	@Override
	public void progress(String line) {
		status(glyphs.progress(), line);
	}

	@Override
	public void box(String title, SequencedMap<String, String> rows) {
		Screen.box(glyphs, title, rows).forEach(this::print);
	}

	@Override
	public void list(String title, List<String> items) {
		Screen.tree(glyphs, title, items).forEach(this::print);
	}

	@Override
	public void print(String line) {
		PrintWriter out = console.writer();
		out.println(line);
		out.flush();
	}

	private void status(String symbol, String line, String... continuation) {
		PrintWriter out = console.writer();
		out.println(column(symbol) + line);
		for (String more : continuation) {
			out.println(INDENT + more);
		}
		out.flush();
	}

	/** {@code ?  Label           [default] ❯ }: the label padded to the label column. */
	private String questionLine(String question, String brackets) {
		return column(QUESTION) + Screen.padded(question) + brackets + " " + glyphs.prompt() + " ";
	}

	/** The symbol padded to the symbol column. */
	private static String column(String symbol) {
		return symbol + " ".repeat(Math.max(SYMBOL_WIDTH - symbol.length(), 1));
	}

	/**
	 * Prints the prompt on the same line and reads the answer, stripped of surrounding whitespace.
	 *
	 * @throws SetupCancelledException on {@code q} (any case) and at the end of the input
	 */
	private String ask(String prompt) {
		PrintWriter out = console.writer();
		out.print(prompt);
		out.flush();
		String line = console.readLine();
		if (line == null) {
			out.println();
			throw new SetupCancelledException();
		}
		String input = line.strip();
		if (input.equalsIgnoreCase(CANCEL)) {
			throw new SetupCancelledException();
		}
		return input;
	}

	/** Prints each line of {@code text} under the symbol column, so a help text with line breaks stays aligned. */
	private void printIndented(String text) {
		PrintWriter out = console.writer();
		for (String line : text.split("\n")) {
			out.println(INDENT + line);
		}
	}

}
