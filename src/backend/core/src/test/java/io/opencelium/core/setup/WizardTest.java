package io.opencelium.core.setup;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The wizard loop: the banner first, then the steps in order, skipping those that do not apply; then the planned
 * files are written and the application starts. A cancel ends the run with "nothing written" and exit code 0; a
 * write failure ends it with exit code 1 and starts nothing.
 */
class WizardTest {

	private static final String REASON = "no configuration was found";

	@TempDir
	Path tmp;

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final List<String> ran = new ArrayList<>();

	private boolean started;

	@Test
	void runAsksStepsInDeclaredOrder() {
		OptionalInt exitCode = wizard(List.of(recording("first"), recording("second"))).run(REASON);

		assertThat(exitCode).hasValue(0);
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
			public void run(SetupContext context, Prompter prompter) {
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

		OptionalInt exitCode = wizard(List.of(recording("first"), cancelling, recording("never"))).run(REASON);

		assertThat(exitCode).hasValue(0);
		assertThat(ran).containsExactly("first");
		assertThat(console.output()).contains("Setup cancelled. Nothing was written.");
		assertThat(started).isFalse();
	}

	@Test
	void runPrintsBannerBeforeFirstQuestion() {
		console.type("");
		SetupStep asking = (context, prompter) -> prompter.text("Web port", "help", "1", value -> Optional.empty());

		wizard(List.of(asking)).run(REASON);

		assertThat(console.output()).containsSubsequence("OpenCelium 1.2.3 · setup",
				"No configuration was found. I will ask a few questions", "Type ? for help, q to quit.",
				"Web port [1]: ");
	}

	@Test
	void runOmitsVersionWhenUnknown() {
		new Wizard(new ConsolePrompter(console), List.of(), () -> started = true, Optional.empty())
				.run("requested with setup");

		assertThat(console.output()).contains("OpenCelium · setup").contains("Requested with setup. I will ask");
	}

	@Test
	void runWritesPlanThenStartsWhenSummaryIsConfirmed() {
		Path file = tmp.resolve("config/application.yml");
		Wizard wizard = wizard(List.of(planning(file)));

		OptionalInt exitCode = wizard.run(REASON);

		assertThat(exitCode).isEmpty();
		assertThat(file).content().isEqualTo("port: 1\n");
		assertThat(console.output()).contains("Configuration written to " + tmp.resolve("config")
				+ ". OpenCelium starts now.");
		assertThat(started).isTrue();
		assertThat(wizard.hasWritten()).isTrue();
	}

	@Test
	void runDoesNotStartWhenWriteFails() throws IOException {
		Files.writeString(tmp.resolve("blocker"), "a file where a directory is needed");
		Path file = tmp.resolve("blocker/application.yml");
		Wizard wizard = wizard(List.of(planning(file)));

		OptionalInt exitCode = wizard.run(REASON);

		assertThat(exitCode).hasValue(1);
		assertThat(console.output()).contains("Cannot write " + file).contains("Nothing was written.");
		assertThat(started).isFalse();
		assertThat(wizard.hasWritten()).isFalse();
	}

	@Test
	void runStartsNothingWhenNoStepPlannedAFile() {
		OptionalInt exitCode = wizard(List.of(recording("only"))).run(REASON);

		assertThat(exitCode).hasValue(0);
		assertThat(started).isFalse();
		assertThat(console.output()).doesNotContain("Configuration written");
	}

	@Test
	void standardStepsAskTheDataDirectoryThenThePortThenShowTheSummary() {
		var locations = new ConfigLocations(tmp, tmp.resolve("etc/opencelium"));

		assertThat(Wizard.standardSteps(locations)).hasExactlyElementsOfTypes(DataDirStep.class, PortStep.class,
				SummaryStep.class);
	}

	private Wizard wizard(List<SetupStep> steps) {
		return new Wizard(new ConsolePrompter(console), steps, () -> started = true, Optional.of("1.2.3"));
	}

	private SetupStep recording(String name) {
		return (context, prompter) -> ran.add(name);
	}

	private static SetupStep planning(Path file) {
		return (context, prompter) -> context.filePlan().add(PlannedFile.groupReadable(file, "port: 1\n"));
	}

}
