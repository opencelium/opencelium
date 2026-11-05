package io.opencelium.core.testsupport.fake;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import io.opencelium.core.setup.host.CommandRunner;

/**
 * A command runner that runs nothing: it records each command as 1 line, the words joined by a space, with its
 * working directory, and answers with the result given for that line. A command without a given result ends with
 * exit code 0 and no output.
 */
public final class RecordingCommandRunner implements CommandRunner {

	private final Map<String, Result> results = new HashMap<>();

	private final List<String> commands = new ArrayList<>();

	private final List<Path> directories = new ArrayList<>();

	/** The result of each later run of {@code command}, for example {@code docker compose version}. */
	public RecordingCommandRunner answer(String command, int exitCode, String output) {
		results.put(command, new Result(exitCode, output));
		return this;
	}

	@Override
	public Result run(Path directory, List<String> command) {
		String line = String.join(" ", command);
		commands.add(line);
		directories.add(directory);
		return results.getOrDefault(line, new Result(0, ""));
	}

	/** The commands so far, in order. */
	public List<String> commands() {
		return List.copyOf(commands);
	}

	/** The working directory of each command so far, in the order of {@link #commands()}. */
	public List<Path> directories() {
		return List.copyOf(directories);
	}

}
