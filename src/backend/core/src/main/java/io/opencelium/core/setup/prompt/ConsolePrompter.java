package io.opencelium.core.setup.prompt;

import java.io.PrintWriter;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

import io.opencelium.core.setup.SetupCancelledException;

/**
 * Asks on a console. Bad input is explained and the question is asked again, so a typo never ends the wizard;
 * only {@code q} and the end of the input do. The layout follows the setup screens: questions indented by 2,
 * options by 4, the prompt shows the default in brackets.
 */
public final class ConsolePrompter implements Prompter {

	static final String CANCEL = "q";

	static final String HELP = "?";

	private static final String INDENT = "  ";

	private static final String OPTION_INDENT = "    ";

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
		out.println(INDENT + question);
		int width = options.stream().mapToInt(option -> option.label().length()).max().orElseThrow();
		for (int i = 0; i < options.size(); i++) {
			Choice option = options.get(i);
			out.println(OPTION_INDENT + (i + 1) + ") " + option.label()
					+ " ".repeat(width - option.label().length() + 4) + option.summary());
		}
		while (true) {
			String input = ask(INDENT + "Choice [" + (defaultIndex + 1) + "]: ");
			if (input.isEmpty()) {
				return defaultIndex;
			}
			if (input.equals(HELP)) {
				for (int i = 0; i < options.size(); i++) {
					printIndented(OPTION_INDENT, (i + 1) + ") " + options.get(i).label() + ": " + options.get(i).help());
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
			out.println(INDENT + "Please enter a number between 1 and " + options.size() + ".");
		}
	}

	@Override
	public String text(String question, String help, String defaultValue,
			Function<String, Optional<String>> validator) {
		PrintWriter out = console.writer();
		while (true) {
			String input = ask(INDENT + question + " [" + defaultValue + "]: ");
			if (input.equals(HELP)) {
				printIndented(INDENT, help);
				continue;
			}
			String value = input.isEmpty() ? defaultValue : input;
			Optional<String> problem = validator.apply(value);
			if (problem.isEmpty()) {
				return value;
			}
			out.println(INDENT + problem.get());
		}
	}

	@Override
	public void print(String line) {
		PrintWriter out = console.writer();
		out.println(line);
		out.flush();
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

	/** Prints each line of {@code text} with the indent, so a help text with line breaks stays aligned. */
	private void printIndented(String indent, String text) {
		PrintWriter out = console.writer();
		for (String line : text.split("\n")) {
			out.println(indent + line);
		}
	}

}
