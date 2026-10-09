package io.opencelium.core.testsupport.fake;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;

import io.opencelium.core.setup.prompt.ConsoleIo;

/**
 * A console for tests of the setup prompts: the input is scripted line by line, the output is captured. When the
 * scripted lines are used up, the input has ended, which the prompts treat as a cancel. The charset is UTF-8
 * unless a test asks for another one, to see the ASCII screens.
 */
public final class ScriptedConsoleIo implements ConsoleIo {

	private final Deque<String> lines = new ArrayDeque<>();

	private final StringWriter captured = new StringWriter();

	private final PrintWriter writer = new PrintWriter(captured, true);

	private final Charset charset;

	public ScriptedConsoleIo() {
		this(StandardCharsets.UTF_8);
	}

	public ScriptedConsoleIo(Charset charset) {
		this.charset = charset;
	}

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
	public PrintWriter writer() {
		return writer;
	}

	@Override
	public Charset charset() {
		return charset;
	}

	/** Everything printed so far. */
	public String output() {
		writer.flush();
		return captured.toString();
	}

}
