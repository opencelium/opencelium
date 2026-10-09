package io.opencelium.core.setup.prompt;

import java.io.PrintWriter;

/**
 * The seam between the prompts and the terminal: one line in, text out. The production implementation is
 * {@code System.console()}; tests script the input. A masked password method joins when the first step needs one.
 */
public interface ConsoleIo {

	/** @return the next line the user typed, without its line end; {@code null} when the input has ended */
	String readLine();

	PrintWriter writer();

	/**
	 * The console of this process. Without one (a pipe, a service) the output goes to standard output and a read
	 * fails; the wizard then runs in batch mode and never reads.
	 */
	static ConsoleIo ofSystemConsole() {
		return new SystemConsoleIo();
	}

}
