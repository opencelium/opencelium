package io.opencelium.core.setup;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.steps.ModeStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The wizard loop: the banner first, then the steps in order, skipping those that do not apply; a cancel ends the
 * run with "nothing written" and exit code 0.
 */
class WizardTest {

	private static final String REASON = "no configuration was found";

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final List<String> ran = new ArrayList<>();

	@Test
	void runAsksStepsInDeclaredOrder() {
		int exitCode = wizard(List.of(recording("first"), recording("second"))).run(REASON);

		assertThat(exitCode).isZero();
		assertThat(ran).containsExactly("first", "second");
	}

	@Test
	void runSkipsStepWhenNotApplicable() {
		SetupStep skipped = new SetupStep() {
			@Override
			public boolean applicable(SetupContext context) {
				return false;
			}

			@Override
			public void run(SetupContext context, io.opencelium.core.setup.prompt.Prompter prompter) {
				ran.add("skipped");
			}
		};

		wizard(List.of(recording("first"), skipped, recording("last"))).run(REASON);

		assertThat(ran).containsExactly("first", "last");
	}

	@Test
	void runPrintsNothingWrittenAndStopsWhenStepCancels() {
		SetupStep cancelling = (context, prompter) -> {
			throw new SetupCancelledException();
		};

		int exitCode = wizard(List.of(recording("first"), cancelling, recording("never"))).run(REASON);

		assertThat(exitCode).isZero();
		assertThat(ran).containsExactly("first");
		assertThat(console.output()).contains("Setup cancelled. Nothing was written.");
	}

	@Test
	void runPrintsBannerBeforeFirstQuestion() {
		console.type("");

		wizard(List.of(new ModeStep())).run(REASON);

		assertThat(console.output()).containsSubsequence("OpenCelium 1.2.3 · setup",
				"No configuration was found. I will ask a few questions", "Type ? for help, q to quit.",
				"How will this OpenCelium run?");
	}

	@Test
	void runOmitsVersionWhenUnknown() {
		new Wizard(new ConsolePrompter(console), List.of(), Optional.empty()).run("requested with setup");

		assertThat(console.output()).contains("OpenCelium · setup").contains("Requested with setup. I will ask");
	}

	@Test
	void runPrintsTheModeAfterTheSteps() {
		console.type("2");

		wizard(List.of(new ModeStep())).run(REASON);

		assertThat(console.output()).contains("Mode: cloud. The other questions come in the next change.");
	}

	private Wizard wizard(List<SetupStep> steps) {
		return new Wizard(new ConsolePrompter(console), steps, Optional.of("1.2.3"));
	}

	private SetupStep recording(String name) {
		return (context, prompter) -> ran.add(name);
	}

}
