package io.opencelium.core.setup.prompt;

import java.io.Console;
import java.io.PrintWriter;

/** {@code System.console()}, looked up at each use so that a process without a console fails with a clear message. */
final class SystemConsoleIo implements ConsoleIo {

	@Override
	public String readLine() {
		return console().readLine();
	}

	@Override
	public PrintWriter writer() {
		return console().writer();
	}

	private static Console console() {
		Console console = System.console();
		if (console == null) {
			throw new IllegalStateException("No console is attached to this process.");
		}
		return console;
	}

}
