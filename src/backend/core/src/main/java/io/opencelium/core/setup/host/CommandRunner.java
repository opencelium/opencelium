package io.opencelium.core.setup.host;

import java.nio.file.Path;
import java.util.List;
import java.util.Objects;

/**
 * Runs a program of this host, for example {@code systemctl}, and waits for its end. Each host command of the setup
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
