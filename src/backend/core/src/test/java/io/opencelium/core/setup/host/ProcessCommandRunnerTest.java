package io.opencelium.core.setup.host;

import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.host.CommandRunner.Result;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The runner of host programs: it waits for the end of the program and gives its exit code and its output, standard
 * error included. A program that cannot start gives exit code 127 and the reason, not an exception. The tests run
 * the JVM of the test itself, because each test host has it.
 */
class ProcessCommandRunnerTest {

	private static final String JAVA = Path.of(System.getProperty("java.home"), "bin", "java").toString();

	@TempDir
	Path directory;

	private final ProcessCommandRunner runner = new ProcessCommandRunner();

	@Test
	void runReturnsExitCodeAndOutputWhenProgramEnds() {
		Result result = runner.run(directory, List.of(JAVA, "-version"));

		assertThat(result.exitCode()).isZero();
		assertThat(result.succeeded()).isTrue();
		// The JVM prints its version to standard error.
		assertThat(result.output()).contains("version");
	}

	@Test
	void runReturnsTheExitCodeOfTheProgramWhenItFails() {
		Result result = runner.run(directory, List.of(JAVA, "-no-such-option"));

		assertThat(result.exitCode()).isNotZero();
		assertThat(result.succeeded()).isFalse();
		assertThat(result.output()).contains("-no-such-option");
	}

	@Test
	void runReturnsCannotStartWhenProgramIsMissing() {
		Result result = runner.run(directory, List.of("oc-no-such-program", "version"));

		assertThat(result.exitCode()).isEqualTo(Result.CANNOT_START);
		assertThat(result.output()).contains("oc-no-such-program");
	}

}
