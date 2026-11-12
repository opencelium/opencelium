package io.opencelium.core.setup.prompt;

import java.io.Console;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.Map;

/**
 * {@code System.console()}, looked up at each use. Without a console the writer is standard output, so the
 * batch wizard can still print; a read then fails with a clear message. A line without an echo is the password read
 * of the console, which prints the prompt when the echo is off and puts the echo back when the user presses Ctrl+C.
 * Whether the lines can carry color comes from the terminal state, the environment and the platform.
 */
final class SystemConsoleIo implements ConsoleIo {

	private static final String NO_COLOR = "NO_COLOR";

	private static final String TERM = "TERM";

	private static final String DUMB_TERMINAL = "dumb";

	private static final String WINDOWS = "Windows";

	private static final String WINDOWS_TERMINAL_SESSION = "WT_SESSION";

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
		Console console = System.console();
		return showsColors(console != null && console.isTerminal(), System.getenv(),
				System.getProperty("os.name", ""));
	}

	/**
	 * Colors only on a terminal, so a file or a pipe never gets an escape code, and never when {@code NO_COLOR} has a
	 * value, the common way to switch colors off for each command-line tool. On Windows only Windows Terminal, which
	 * sets {@code WT_SESSION}, draws the codes; the classic console prints them as text. On each other platform the
	 * terminal type decides: no {@code TERM} or {@code TERM=dumb} gets plain lines.
	 */
	static boolean showsColors(boolean terminal, Map<String, String> environment, String osName) {
		if (!terminal || hasValue(environment, NO_COLOR)) {
			return false;
		}
		if (osName.startsWith(WINDOWS)) {
			return hasValue(environment, WINDOWS_TERMINAL_SESSION);
		}
		return hasValue(environment, TERM) && !DUMB_TERMINAL.equals(environment.get(TERM));
	}

	private static boolean hasValue(Map<String, String> environment, String name) {
		String value = environment.get(name);
		return value != null && !value.isEmpty();
	}

	private static Console console() {
		Console console = System.console();
		if (console == null) {
			throw new IllegalStateException("No console is attached to this process.");
		}
		return console;
	}

}
