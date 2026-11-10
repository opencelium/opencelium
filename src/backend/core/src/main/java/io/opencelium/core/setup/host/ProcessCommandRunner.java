package io.opencelium.core.setup.host;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.StringJoiner;

/**
 * Runs the programs of this host as child processes. The output of the program is read in full, standard error
 * together with standard output, and nothing of it is printed: the caller decides what the user sees. The program
 * gets no input, so a program that asks a question ends instead of waiting. It gets the environment of this process.
 */
public final class ProcessCommandRunner implements CommandRunner {

	@Override
	public Result run(Path directory, List<String> command) {
		var builder = new ProcessBuilder(command).directory(directory.toFile()).redirectErrorStream(true);
		Process process;
		try {
			process = builder.start();
		}
		catch (IOException ex) {
			// The JDK message names the program and the reason, for example "No such file or directory".
			return new Result(Result.CANNOT_START, ex.getMessage());
		}
		try (BufferedReader output = process.inputReader()) {
			process.getOutputStream().close();
			var text = new StringJoiner("\n");
			for (String line = output.readLine(); line != null; line = output.readLine()) {
				text.add(line);
			}
			return new Result(process.waitFor(), text.toString());
		}
		catch (IOException ex) {
			process.destroy();
			return new Result(Result.CANNOT_START, "Cannot read the output of " + command.getFirst() + ": "
					+ ex.getMessage());
		}
		catch (InterruptedException ex) {
			process.destroy();
			Thread.currentThread().interrupt();
			return new Result(Result.CANNOT_START, command.getFirst() + " was interrupted.");
		}
	}

}
