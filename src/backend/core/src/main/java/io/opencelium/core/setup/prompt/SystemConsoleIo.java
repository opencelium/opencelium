package io.opencelium.core.setup.prompt;

import java.io.Console;
import java.io.PrintWriter;

/**
 * {@code System.console()}, looked up at each use. Without a console the writer is standard output, so the
 * non-interactive wizard can still print; a read then fails with a clear message.
 */
final class SystemConsoleIo implements ConsoleIo {

	private final PrintWriter standardOut = new PrintWriter(System.out, true);

	@Override
	public String readLine() {
		return console().readLine();
	}

	@Override
	public PrintWriter writer() {
		Console console = System.console();
		return console != null ? console.writer() : standardOut;
	}

	private static Console console() {
		Console console = System.console();
		if (console == null) {
			throw new IllegalStateException("No console is attached to this process.");
		}
		return console;
	}

}
