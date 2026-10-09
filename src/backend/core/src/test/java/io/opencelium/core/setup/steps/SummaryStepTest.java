package io.opencelium.core.setup.steps;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

/** The summary: a section rule and the aligned table of the answers, the mode always self-host. */
class SummaryStepTest {

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final SetupContext context = new SetupContext();

	@Test
	void runPrintsModeDataDirectoryAndPortAligned() {
		context.setDataDir(Path.of("/srv/oc"));
		context.setPort(9090);

		new SummaryStep().run(context, new ConsolePrompter(console));

		assertThat(console.output()).containsSubsequence("── Summary ", "  Mode" + " ".repeat(12) + "self-host",
				"  Data directory  /srv/oc", "  Port" + " ".repeat(12) + "9090",
				"The file write comes in the next change.");
	}

	@Test
	void runFailsWhenAnEarlierAnswerIsMissing() {
		assertThatIllegalStateException()
				.isThrownBy(() -> new SummaryStep().run(context, new ConsolePrompter(console)))
				.withMessageContaining("data directory");
	}

}
