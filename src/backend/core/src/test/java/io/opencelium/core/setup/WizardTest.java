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

import io.opencelium.core.setup.values.SetupValues;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.steps.AdminStep;
import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.MasterKeyStep;
import io.opencelium.core.setup.steps.MongoStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;
import io.opencelium.core.testsupport.fake.NamedStep;
import io.opencelium.core.testsupport.fake.RecordingAction;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

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
			public String name() {
				return "Skipped";
			}

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
	void runShowsTheNumberTheCountAndTheNameBeforeEachStep() {
		SetupStep dataDir = new NamedStep("Data directory", (context, prompter) -> prompter.info("data directory ran"));
		SetupStep port = new NamedStep("Web port", (context, prompter) -> prompter.info("port ran"));

		wizard(List.of(dataDir, port)).run(REASON);

		// One empty line between the banner and the first step, and before each next step.
		assertThat(console.output()).contains("Type ? for help, q to quit.\n\n  Step 1 of 2: Data directory\n  "
				+ "-".repeat(74) + "\n  data directory ran\n\n  Step 2 of 2: Web port\n  " + "-".repeat(74)
				+ "\n  port ran\n");
	}

	@Test
	void runMarksTheTitleAsSkippedWhenAStepDoesNotApply() {
		SetupStep admin = new SetupStep() {
			@Override
			public String name() {
				return "Admin account";
			}

			@Override
			public boolean applicable(SetupContext context) {
				return false;
			}

			@Override
			public void run(SetupContext context, Prompter prompter) {
				ran.add("admin");
			}
		};

		wizard(List.of(recording("Master key"), admin, recording("Summary"))).run(REASON);

		// The numbers have no gap, and each title line shows the same step count.
		assertThat(console.output()).contains("\n  Step 2 of 3: Admin account (skipped)\n  " + "-".repeat(74)
				+ "\n\n  Step 3 of 3: Summary\n");
		assertThat(ran).containsExactly("Master key", "Summary");
	}

	@Test
	void runPrintsNothingWrittenAndStopsWhenStepCancels() {
		SetupStep cancelling = new NamedStep("Cancelling", (context, prompter) -> {
			throw new SetupCancelledException();
		});

		OptionalInt exitCode = wizard(List.of(recording("first"), cancelling, recording("never"))).run(REASON);

		assertThat(exitCode).hasValue(0);
		assertThat(ran).containsExactly("first");
		assertThat(console.output()).contains("\n  Setup cancelled. Nothing was written.\n");
		assertThat(started).isFalse();
	}

	@Test
	void runPrintsBannerBeforeFirstQuestion() {
		console.type("");
		SetupStep asking = new NamedStep("Web port",
				(context, prompter) -> prompter.text("Web port", "help", "1", value -> Optional.empty()));

		wizard(List.of(asking)).run(REASON);

		assertThat(console.output()).containsSubsequence("  OpenCelium setup (1.2.3)\n  " + "-".repeat(74),
				"  No configuration was found. Let's set up OpenCelium.",
				"  Press Enter to accept the value in [brackets]. Type ? for help, q to quit.",
				"  Web port        [1]: ");
	}

	@Test
	void runOmitsVersionWhenUnknown() {
		new Wizard(new ConsolePrompter(console), ValueSource.PROMPTED, List.of(), environment -> started = true,
				Optional.empty())
				.run("requested with setup");

		assertThat(console.output()).contains("  OpenCelium setup\n").contains("  Requested with setup. Let's set up");
	}

	@Test
	void runWritesPlanThenStartsWhenSummaryIsConfirmed() {
		Path file = tmp.resolve("config/application.yml");
		Wizard wizard = wizard(List.of(planning(file)));

		OptionalInt exitCode = wizard.run(REASON);

		assertThat(exitCode).isEmpty();
		assertThat(file).content().isEqualTo("port: 1\n");
		assertThat(console.output()).contains("  OK Configuration written to " + tmp.resolve("config")
				+ "\n  -> Starting OpenCelium...\n");
		assertThat(started).isTrue();
		assertThat(wizard.hasWritten()).isTrue();
	}

	@Test
	void runThrowsSetupFailedAndDoesNotStartWhenWriteFails() throws IOException {
		Files.writeString(tmp.resolve("blocker"), "a file where a directory is needed");
		Path file = tmp.resolve("blocker/application.yml");
		Wizard wizard = wizard(List.of(planning(file)));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> wizard.run(REASON)).actual();

		// The launcher prints it on standard error, like every failure that ends the setup.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).startsWith("Cannot write " + file + ": ").endsWith("\nNothing was written.");
		assertThat(console.output()).doesNotContain("Cannot write");
		assertThat(started).isFalse();
		assertThat(wizard.hasWritten()).isFalse();
	}

	@Test
	void runPrintsNothingWrittenAndRemovesTheFilesWhenAnActionIsCancelled() {
		Path file = tmp.resolve("config/application.yml");
		SetupStep planning = new NamedStep("Planning", (context, prompter) -> {
			context.filePlan().add(PlannedFile.groupReadable(file, "port: 1\n"));
			context.filePlan().add(new RecordingAction("confirm", new ArrayList<>()).onRun(() -> {
				throw new SetupCancelledException();
			}));
		});
		Wizard wizard = wizard(List.of(planning));

		OptionalInt exitCode = wizard.run(REASON);

		assertThat(exitCode).hasValue(0);
		assertThat(file).doesNotExist();
		assertThat(console.output()).contains("\n  Setup cancelled. Nothing was written.\n")
				.doesNotContain("Configuration written");
		assertThat(started).isFalse();
		assertThat(wizard.hasWritten()).isFalse();
	}

	@Test
	void runCountsTheFilesAsWrittenWhileAnActionRuns() {
		Path file = tmp.resolve("config/application.yml");
		List<Boolean> writtenDuringTheAction = new ArrayList<>();
		Wizard[] wizard = new Wizard[1];
		SetupStep planning = new NamedStep("Planning", (context, prompter) -> {
			context.filePlan().add(PlannedFile.groupReadable(file, "port: 1\n"));
			context.filePlan().add(new RecordingAction("confirm", new ArrayList<>())
					.onRun(() -> writtenDuringTheAction.add(wizard[0].hasWritten())));
		});
		wizard[0] = wizard(List.of(planning));

		wizard[0].run(REASON);

		// Ctrl+C at a question of an action must not say "nothing was written".
		assertThat(writtenDuringTheAction).containsExactly(true);
	}

	@Test
	void runPrintsBoxWithUrlUsernameAndPasswordWhenPortListens() {
		// The probe answers only after the start: a box before the start would show nothing.
		Wizard wizard = new Wizard(new ConsolePrompter(console), ValueSource.PROMPTED, List.of(admin("root", 9191)),
				environment -> started = true, Optional.of("1.2.3"), port -> started && port == 9191);

		OptionalInt exitCode = wizard.run(REASON);

		assertThat(exitCode).isEmpty();
		assertThat(console.output()).containsSubsequence("  -> Starting OpenCelium...", "  +-- Log in to OpenCelium ",
				"  |  URL             http://localhost:9191/setup ", "  |  Admin username  root ",
				"  |  Admin password  1234 ");
	}

	@Test
	void runPrintsOnlyTheUrlWhenTheAdminStepIsSkipped() {
		// An admin exists, and its admin password can be another one than 1234.
		SetupStep answers = new NamedStep("Web port", (context, prompter) -> {
			context.setPort(9191);
			context.filePlan().add(PlannedFile.groupReadable(tmp.resolve("config/application.yml"), "port: 1\n"));
		});
		Wizard wizard = new Wizard(new ConsolePrompter(console), ValueSource.PROMPTED, List.of(answers),
				environment -> started = true, Optional.of("1.2.3"), port -> started && port == 9191);

		wizard.run(REASON);

		assertThat(console.output()).containsSubsequence("  -> Starting OpenCelium...", "  +-- Log in to OpenCelium ",
				"  |  URL             http://localhost:9191/setup ").doesNotContain("Admin username")
				.doesNotContain("1234");
	}

	@Test
	void runPrintsNoBoxWhenThePortDoesNotListen() {
		Wizard wizard = new Wizard(new ConsolePrompter(console), ValueSource.PROMPTED, List.of(admin("root", 9191)),
				environment -> started = true, Optional.of("1.2.3"), port -> false);

		wizard.run(REASON);

		assertThat(started).isTrue();
		assertThat(console.output()).contains("Starting OpenCelium...").doesNotContain("Log in to OpenCelium")
				.doesNotContain("1234");
	}

	@Test
	void runOmitsTheKeyHintFromTheBannerWhenBatch() {
		var batch = new ValueSource(SetupValues.NONE, Optional.of(Path.of("setup-values.yml")), true);

		new Wizard(new ConsolePrompter(console), batch, List.of(), environment -> started = true, Optional.of("1.2.3"))
				.run(REASON);

		assertThat(console.output()).contains("  No configuration was found. Let's set up OpenCelium.\n")
				.doesNotContain("Press Enter");
	}

	@Test
	void runStartsNothingWhenNoStepPlannedAFile() {
		OptionalInt exitCode = wizard(List.of(recording("only"))).run(REASON);

		assertThat(exitCode).hasValue(0);
		assertThat(started).isFalse();
		assertThat(console.output()).doesNotContain("Configuration written");
	}

	@Test
	void standardStepsAskTheDataDirectoryThePortMongoDbTheMasterKeyAndTheAdminThenShowTheSummary() {
		var locations = new ConfigLocations(tmp, tmp.resolve("etc/opencelium"));

		assertThat(Wizard.standardSteps(locations)).hasExactlyElementsOfTypes(DataDirStep.class, PortStep.class,
				MongoStep.class, MasterKeyStep.class, AdminStep.class, SummaryStep.class);
	}

	@Test
	void standardStepsHaveTheNamesOfTheirScreens() {
		var locations = new ConfigLocations(tmp, tmp.resolve("etc/opencelium"));

		assertThat(Wizard.standardSteps(locations)).extracting(SetupStep::name)
				.containsExactly("Data directory", "Web port", "MongoDB", "Master key", "Admin account", "Summary");
	}

	private Wizard wizard(List<SetupStep> steps) {
		return new Wizard(new ConsolePrompter(console), ValueSource.PROMPTED, steps, environment -> started = true,
				Optional.of("1.2.3"));
	}

	private SetupStep recording(String name) {
		return new NamedStep(name, (context, prompter) -> ran.add(name));
	}

	/** The answers of a full setup that matter for the login box: the port, the admin username, and a file. */
	private SetupStep admin(String username, int port) {
		return new NamedStep("Admin account", (context, prompter) -> {
			context.setPort(port);
			context.setAdminUsername(username);
			context.filePlan().add(PlannedFile.groupReadable(tmp.resolve("config/application.yml"), "port: 1\n"));
		});
	}

	private static SetupStep planning(Path file) {
		return new NamedStep("Planning",
				(context, prompter) -> context.filePlan().add(PlannedFile.groupReadable(file, "port: 1\n")));
	}

}
