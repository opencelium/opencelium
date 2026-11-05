package io.opencelium.core.setup.host;

import java.nio.file.Path;
import java.util.List;

/**
 * Runs the programs of this host as child processes. The output of the program is read in full, standard error
 * together with standard output, and nothing of it is printed: the caller decides what the user sees. The program
 * gets no input, so a program that asks a question ends instead of waiting.
 */
public final class ProcessCommandRunner implements CommandRunner {

	@Override
	public Result run(Path directory, List<String> command) {
		throw new UnsupportedOperationException();
	}

}
