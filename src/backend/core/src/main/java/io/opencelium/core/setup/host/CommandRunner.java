package io.opencelium.core.setup.host;

import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.function.Consumer;

/**
 * Runs a program of this host, for example {@code docker}, and waits for its end. Each host command of the setup
 * goes through this seam, so a test gives a fake that records the commands and answers them, and no test needs the
 * program on its host.
 */
@FunctionalInterface
public interface CommandRunner {

	/**
	 * @param directory the working directory of the program
	 * @param command   the program and its arguments, as they are: no shell reads them
	 * @return the exit code and the output; a program that cannot start gives {@link Result#CANNOT_START} and the
	 *         reason as the output
	 */
	Result run(Path directory, List<String> command);

	/**
	 * The same run, and each line of the output also goes to {@code eachLine}, for example to show the progress of a
	 * download. A runner of real programs gives each line while the program runs; this default gives the lines of
	 * the output after the end, which is enough for a fake.
	 *
	 * @param eachLine gets each line of the output without its line end, in order
	 */
	default Result run(Path directory, List<String> command, Consumer<String> eachLine) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/**
	 * @param output what the program wrote to standard output and standard error, in one text
	 */
	record Result(int exitCode, String output) {

		/** The exit code of a program that cannot start, as a shell gives it for a command that is not found. */
		public static final int CANNOT_START = 127;

		public Result {
			Objects.requireNonNull(output, "output");
		}

		public boolean succeeded() {
			return exitCode == 0;
		}

		/** The last line of the output that is not blank, for a message; {@code no output} when there is none. */
		public String lastLine() {
			return output.lines().map(String::strip).filter(line -> !line.isEmpty()).reduce((first, last) -> last)
					.orElse("no output");
		}

	}

}
