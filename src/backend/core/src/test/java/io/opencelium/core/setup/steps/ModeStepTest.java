package io.opencelium.core.setup.steps;

import org.junit.jupiter.api.Test;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;

/** The first question: self-host is the default, cloud is the second option, {@code ?} explains both. */
class ModeStepTest {

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final SetupContext context = new SetupContext();

	@Test
	void runStoresSelfHostWhenDefaultIsAccepted() {
		console.type("");

		new ModeStep().run(context, new ConsolePrompter(console));

		assertThat(context.deploymentMode()).contains(DeploymentMode.SELF_HOST);
		assertThat(console.output()).contains("How will this OpenCelium run?").contains("Choice [1]: ");
	}

	@Test
	void runStoresCloudWhenSecondOptionIsTyped() {
		console.type("2");

		new ModeStep().run(context, new ConsolePrompter(console));

		assertThat(context.deploymentMode()).contains(DeploymentMode.CLOUD);
	}

	@Test
	void runExplainsBothModesWhenInputIsQuestionMark() {
		console.type("?", "");

		new ModeStep().run(context, new ConsolePrompter(console));

		assertThat(console.output()).contains("1) Self-host").contains("2) Cloud").contains("Service Portal");
	}

}
