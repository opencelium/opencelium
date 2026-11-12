package io.opencelium.core.setup.prompt;

import java.io.PrintWriter;

/**
 * The seam between the prompts and the terminal: one line in, text out. The production implementation is
 * {@code System.console()}; tests script the input. A line that holds a secret is read without an echo.
 */
public interface ConsoleIo {

	/** @return the next line the user typed, without its line end; {@code null} when the input has ended */
	String readLine();

	/**
	 * Prints {@code prompt} and reads the next line without an echo: the terminal does not show the characters while
	 * the user types them. The console prints the prompt itself, after it switches the echo off. A prompt that is
	 * printed before that shows the first characters of an answer that comes at once, for example a pasted one.
	 *
	 * @return the line as typed, without its line end; {@code null} when the input has ended
	 */
	String readLineWithoutEcho(String prompt);

	PrintWriter writer();

	/**
	 * Whether the lines can carry color: a terminal that draws the escape codes for colors. A file, a pipe and a
	 * terminal that prints those codes as text get plain lines, so a log never holds an escape code.
	 */
	boolean showsColors();

	/**
	 * The console of this process. Without one (a pipe, a service) the output goes to standard output and a read
	 * fails; the wizard then runs in batch mode and never reads.
	 */
	static ConsoleIo ofSystemConsole() {
		return new SystemConsoleIo();
	}

}
