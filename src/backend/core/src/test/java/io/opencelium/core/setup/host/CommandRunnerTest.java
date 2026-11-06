package io.opencelium.core.setup.host;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.host.CommandRunner.Result;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The result of a host command: the last line of its output goes into a message when the command fails. A runner
 * that only answers, like a fake, gives the lines of its output after the end.
 */
class CommandRunnerTest {

	@Test
	void lastLineSkipsTrailingBlankLinesWhenOutputEndsWithThem() {
		assertThat(new Result(1, "pulling\nError: port is already allocated\n\n").lastLine())
				.isEqualTo("Error: port is already allocated");
	}

	@Test
	void lastLineReturnsNoOutputWhenOutputIsBlank() {
		assertThat(new Result(1, " \n").lastLine()).isEqualTo("no output");
	}

	@Test
	void succeededIsTrueOnlyWhenExitCodeIsZero() {
		assertThat(new Result(0, "").succeeded()).isTrue();
		assertThat(new Result(1, "").succeeded()).isFalse();
	}

	@Test
	void runGivesTheOutputLinesAfterTheEndWhenTheRunnerOnlyAnswers() {
		CommandRunner answers = (directory, command) -> new Result(0, "first\nsecond");
		List<String> lines = new ArrayList<>();

		Result result = answers.run(Path.of("."), List.of("docker", "compose", "pull"), lines::add);

		assertThat(lines).containsExactly("first", "second");
		assertThat(result.output()).isEqualTo("first\nsecond");
	}

}
