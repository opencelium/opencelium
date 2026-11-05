package io.opencelium.core.setup.host;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.host.CommandRunner.Result;

import static org.assertj.core.api.Assertions.assertThat;

/** The result of a host command: the last line of its output goes into a message when the command fails. */
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

}
