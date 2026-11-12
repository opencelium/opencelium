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
 * only {@code q} and the end of the input do. A secret is read without an echo, and each text is its answer, so
 * there only the end of the input ends the wizard. The layout uses plain characters only, so it looks the same on
 * every terminal: a step starts after an empty line with its numbered title over a rule; a question is its label
 * padded to one column, the default in brackets, and a colon; a problem starts with {@code !}, a result with
 * {@code OK}, a start with {@code ->}; help and continuation lines are indented under the question or the status.
 * On a terminal that shows colors, the line of a result is green and the line of a problem red, so a passed check
 * stands out. The marks stay, so the lines say the same without color, in a log file and to a color-blind user.
 */
public final class ConsolePrompter implements Prompter {

	static final String CANCEL = "q";

	static final String HELP = "?";

	/** In the place of the default of a question: the terminal does not show the answer. */
	private static final String HIDDEN = "(hidden)";

	private static final String MARGIN = Screen.MARGIN;

	/** Under the text of a status line, which starts after a mark of 2 and a space. */
	private static final String INDENT = MARGIN + MARGIN;

	private static final String PROBLEM = "! ";

	private static final String DONE = "OK ";

	private static final String STARTS = "-> ";

	private static final String GREEN = "\u001B[32m";

	private static final String RED = "\u001B[31m";

	/** Back to the default color of the terminal. */
	private static final String RESET = "\u001B[0m";

	private final ConsoleIo console;

	public ConsolePrompter(ConsoleIo console) {
		this.console = Objects.requireNonNull(console, "console");
	}

	@Override
	public int choice(String question, List<Choice> options, int defaultIndex) {
		if (options.isEmpty() || defaultIndex < 0 || defaultIndex >= options.size()) {
			throw new IllegalArgumentException("The default " + defaultIndex + " is not one of " + options.size()
					+ " options.");
		}
		PrintWriter out = console.writer();
		out.println();
		out.println(MARGIN + question);
		int width = options.stream().mapToInt(option -> option.label().length()).max().orElseThrow();
		for (int i = 0; i < options.size(); i++) {
			Choice option = options.get(i);
			out.println(INDENT + (i + 1) + ") " + option.label()
					+ " ".repeat(width - option.label().length() + 4) + option.summary());
		}
		while (true) {
			String input = ask(MARGIN + "Choice [" + (defaultIndex + 1) + "]: ");
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
			problem("Please enter a number between 1 and " + options.size() + ".");
		}
	}

	@Override
	public String text(String question, String help, String defaultValue,
			Function<String, Optional<String>> validator) {
		while (true) {
			String input = ask(questionLine(question, "[" + defaultValue + "]"));
			if (input.equals(HELP)) {
				printIndented(help);
				continue;
			}
			String value = input.isEmpty() ? defaultValue : input;
			Optional<String> rejection = validator.apply(value);
			if (rejection.isEmpty()) {
				return value;
			}
			problem(rejection.get());
		}
	}

	@Override
	public boolean yesNo(String question, String help, boolean defaultYes) {
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
				default -> problem("Please answer y or n.");
			}
		}
	}

	@Override
	public String secret(String question) {
		PrintWriter out = console.writer();
		while (true) {
			String line = console.readLineWithoutEcho(questionLine(question, HIDDEN));
			if (line == null) {
				out.println();
				throw new SetupCancelledException();
			}
			if (!line.isEmpty()) {
				return line;
			}
			problem(question + " cannot be empty.");
		}
	}

	@Override
	public void answered(String question, String value, String remark) {
		print(MARGIN + Screen.padded(question) + value + "   (" + remark + ")");
	}

	@Override
	public void title(String title) {
		PrintWriter out = console.writer();
		out.println(MARGIN + title);
		out.println(Screen.rule());
		out.flush();
	}

	@Override
	public void step(int number, int count, String name) {
		print("");
		title("Step " + number + " of " + count + ": " + name);
	}

	@Override
	public void info(String line, String... continuation) {
		PrintWriter out = console.writer();
		out.println(MARGIN + line);
		for (String more : continuation) {
			out.println(MARGIN + more);
		}
		out.flush();
	}

	@Override
	public void error(String line, String... continuation) {
		PrintWriter out = console.writer();
		problem(line);
		for (String more : continuation) {
			out.println(INDENT + more);
		}
		out.flush();
	}

	@Override
	public void success(String line) {
		print(MARGIN + colored(GREEN, DONE + line));
	}

	@Override
	public void progress(String line) {
		print(MARGIN + STARTS + line);
	}

	@Override
	public void box(String title, SequencedMap<String, String> rows) {
		Screen.box(title, rows).forEach(this::print);
	}

	@Override
	public void list(String title, List<String> items) {
		Screen.list(title, items).forEach(this::print);
	}

	@Override
	public void print(String line) {
		PrintWriter out = console.writer();
		out.println(line);
		out.flush();
	}

	/** The line of a problem in the margin: the mark and the message, red on a terminal that shows colors. */
	private void problem(String message) {
		console.writer().println(MARGIN + colored(RED, PROBLEM + message));
	}

	/** The text in the color, then the default color again; the text alone when the console shows no colors. */
	private String colored(String color, String text) {
		return console.showsColors() ? color + text + RESET : text;
	}

	/** {@code   Label           [default]: }: the label padded to the label column. */
	private static String questionLine(String question, String brackets) {
		return MARGIN + Screen.padded(question) + brackets + ": ";
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

	/** Prints each line of {@code text} indented under the question, so a help text with line breaks stays aligned. */
	private void printIndented(String text) {
		PrintWriter out = console.writer();
		for (String line : text.split("\n")) {
			out.println(INDENT + line);
		}
	}

}
