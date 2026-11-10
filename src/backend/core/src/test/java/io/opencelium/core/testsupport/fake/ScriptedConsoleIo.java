package io.opencelium.core.testsupport.fake;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

import io.opencelium.core.setup.prompt.ConsoleIo;

/**
 * A console for tests of the setup prompts: the input is scripted line by line, the output is captured. When the
 * scripted lines are used up, the input has ended, which the prompts treat as a cancel. A read without an echo
 * prints its prompt and gives the next line too. The console keeps that prompt and that line, so a test can tell
 * which answers a terminal hides and which prompts come after the echo is off.
 */
public final class ScriptedConsoleIo implements ConsoleIo {

	private final Deque<String> lines = new ArrayDeque<>();

	private final List<String> withoutEcho = new ArrayList<>();

	private final List<String> promptsWithoutEcho = new ArrayList<>();

	private final StringWriter captured = new StringWriter();

	private final PrintWriter writer = new PrintWriter(captured, true);

	/** Adds what the user types, one line for each entry, in order. An empty string is a bare Enter. */
	public ScriptedConsoleIo type(String... input) {
		lines.addAll(List.of(input));
		return this;
	}

	@Override
	public String readLine() {
		return lines.pollFirst();
	}

	@Override
	public String readLineWithoutEcho(String prompt) {
		promptsWithoutEcho.add(prompt);
		writer.print(prompt);
		String line = lines.pollFirst();
		if (line != null) {
			withoutEcho.add(line);
		}
		return line;
	}

	/** The lines that were read without an echo, in order: the answers that a terminal does not show. */
	public List<String> linesWithoutEcho() {
		return List.copyOf(withoutEcho);
	}

	/** The prompts that the console printed itself for a read without an echo, in order. */
	public List<String> promptsWithoutEcho() {
		return List.copyOf(promptsWithoutEcho);
	}

	@Override
	public PrintWriter writer() {
		return writer;
	}

	/** Everything printed so far. */
	public String output() {
		writer.flush();
		return captured.toString();
	}

}
