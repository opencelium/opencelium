package io.opencelium.core.setup.host;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.StringJoiner;
import java.util.function.Consumer;

/**
 * Runs the programs of this host as child processes. The output of the program is read in full, standard error
 * together with standard output, and nothing of it is printed: the caller decides what the user sees. The caller can
 * get each line while the program runs, for example to show the progress of a download. The program
 * gets no input, so a program that asks a question ends instead of waiting. It gets the environment of this
 * process, without the variables that the caller names.
 */
public final class ProcessCommandRunner implements CommandRunner {

	private final Set<String> removedVariables;

	/** The program gets the whole environment of this process. */
	public ProcessCommandRunner() {
		this(Set.of());
	}

	/**
	 * @param removedVariables the variables of this process that the program must not get, for example a password
	 *                         that would win over the value in a file that the program reads
	 */
	public ProcessCommandRunner(Set<String> removedVariables) {
		this.removedVariables = Set.copyOf(removedVariables);
	}

	@Override
	public Result run(Path directory, List<String> command) {
		return run(directory, command, line -> {
		});
	}

	/** Gives each line to {@code eachLine} as soon as the program writes it, while the program still runs. */
	@Override
	public Result run(Path directory, List<String> command, Consumer<String> eachLine) {
		var builder = new ProcessBuilder(command).directory(directory.toFile()).redirectErrorStream(true);
		builder.environment().keySet().removeAll(removedVariables);
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
				eachLine.accept(line);
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
