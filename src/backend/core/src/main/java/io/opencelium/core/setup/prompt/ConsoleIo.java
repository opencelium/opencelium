package io.opencelium.core.setup.prompt;

import java.io.PrintWriter;
import java.nio.charset.Charset;

/**
 * The seam between the prompts and the terminal: one line in, text out, and the charset the terminal shows, which
 * decides the symbols. The production implementation is {@code System.console()}; tests script the input. A
 * masked password method joins when the first step needs one.
 */
public interface ConsoleIo {

	/** @return the next line the user typed, without its line end; {@code null} when the input has ended */
	String readLine();

	PrintWriter writer();

	/** The charset of the writer: what the terminal can show. */
	Charset charset();

	/** The console of this process. It has to exist, which the launcher checks before the wizard starts. */
	static ConsoleIo ofSystemConsole() {
		return new SystemConsoleIo();
	}

}
