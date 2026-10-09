package io.opencelium.core.setup.prompt;

import java.io.Console;
import java.io.PrintWriter;
import java.nio.charset.Charset;

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

	@Override
	public Charset charset() {
		return console().charset();
	}

	private static Console console() {
		Console console = System.console();
		if (console == null) {
			throw new IllegalStateException("No console is attached to this process.");
		}
		return console;
	}

}
