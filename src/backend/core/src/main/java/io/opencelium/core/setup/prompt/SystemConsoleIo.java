package io.opencelium.core.setup.prompt;

import java.io.Console;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.Map;

/**
 * {@code System.console()}, looked up at each use. Without a console the writer is standard output, so the
 * batch wizard can still print; a read then fails with a clear message. A line without an echo is the password read
 * of the console, which prints the prompt when the echo is off and puts the echo back when the user presses Ctrl+C.
 */
final class SystemConsoleIo implements ConsoleIo {

	private final PrintWriter standardOut = new PrintWriter(System.out, true);

	@Override
	public String readLine() {
		return console().readLine();
	}

	@Override
	public String readLineWithoutEcho(String prompt) {
		// The console switches the echo off first and prints the prompt then.
		char[] typed = console().readPassword("%s", prompt);
		if (typed == null) {
			return null;
		}
		String line = new String(typed);
		Arrays.fill(typed, '\0');
		return line;
	}

	@Override
	public PrintWriter writer() {
		Console console = System.console();
		return console != null ? console.writer() : standardOut;
	}

	@Override
	public boolean showsColors() {
		throw new UnsupportedOperationException();
	}

	static boolean showsColors(boolean terminal, Map<String, String> environment, String osName) {
		throw new UnsupportedOperationException();
	}

	private static Console console() {
		Console console = System.console();
		if (console == null) {
			throw new IllegalStateException("No console is attached to this process.");
		}
		return console;
	}

}
