package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.ConfigLocations;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.values.SetupValues;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.RecordingAction;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.assertj.core.api.Assertions.tuple;

/**
 * The summary: the answers in a box (the mode always self-host, the MongoDB URI without its password), the files
 * that will be written as a list, the actions that earlier steps planned, and the confirmation. Yes plans
 * application.yml and the env file, with the entries of the env file; no cancels the setup.
 */
class SummaryStepTest {

	@TempDir
	Path workingDir;

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final SetupContext context = new SetupContext();

	@Test
	void runPrintsModeDataDirectoryAndPortInABox() {
		answered();
		console.type("");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).containsSubsequence("  +-- Summary --", "  |  Mode" + " ".repeat(12) + "self-host",
				"  |  Data directory  /srv/oc", "  |  Web port        9090", "  +--");
	}

	@Test
	void runNamesTheFilesAndMarksTheOneThatExists() throws IOException {
		answered();
		Files.createDirectories(workingDir.resolve("config"));
		Files.writeString(workingDir.resolve("config/application.yml"), "old");
		console.type("");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).containsSubsequence("  Files to write",
				"    - " + workingDir.resolve("config/application.yml") + "   (replaces the file that exists)",
				"    - " + workingDir.resolve("config/opencelium.env") + "\n",
				"  Write the files and start OpenCelium? [Y/n]: ");
	}

	@Test
	void runListsActionFilesAndActionsWhenAnEarlierStepPlannedAnAction() {
		answered();
		Path unit = workingDir.resolve("systemd/opencelium.service");
		context.filePlan().add(new RecordingAction("Install the service opencelium", new ArrayList<>(),
				PlannedFile.groupReadable(unit, "c")));
		console.type("y");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).containsSubsequence("  Files to write",
				"    - " + workingDir.resolve("config/application.yml"),
				"    - " + workingDir.resolve("config/opencelium.env"), "    - " + unit, "  After the write",
				"    - Install the service opencelium",
				"  Write the files and start OpenCelium? [Y/n]: ");
		assertThat(context.filePlan().files()).extracting(PlannedFile::path).containsExactly(
				workingDir.resolve("config/application.yml"), workingDir.resolve("config/opencelium.env"), unit);
	}

	@Test
	void runAddsYmlAndEnvToPlanWhenConfirmed() {
		answered();
		console.type("y");

		step().run(context, new ConsolePrompter(console));

		assertThat(context.filePlan().files()).extracting(PlannedFile::path, PlannedFile::permissions)
				.containsExactly(tuple(workingDir.resolve("config/application.yml"), PlannedFile.GROUP_READABLE),
						tuple(workingDir.resolve("config/opencelium.env"), PlannedFile.OWNER_ONLY));
		assertThat(context.filePlan().files().get(0).content()).contains("port: 9090")
				.contains("deployment-mode: self-host").contains("data-dir: /srv/oc");
		assertThat(context.filePlan().files().get(1).content()).startsWith("# Written by OpenCelium setup.");
	}

	@Test
	void runPlansTheFilesWithoutAskingWhenBatch() {
		var batch = new SetupContext(new ValueSource(SetupValues.NONE, Optional.of(Path.of("a.yml")), true));
		batch.setDataDir(Path.of("/srv/oc"));
		batch.setPort(9090);
		batch.setMongoUri("mongodb://localhost:27017/opencelium");

		step().run(batch, new ConsolePrompter(console));

		assertThat(batch.filePlan().files()).hasSize(2);
		assertThat(console.output()).contains("  Write the files and start OpenCelium? yes   (batch)")
				.doesNotContain("[Y/n]");
	}

	@Test
	void runShowsMongoDbWithoutPasswordAndPutsThePasswordIntoTheEnvFile() {
		answered();
		context.setMongoUri("mongodb://oc:${OC_MONGO_PASSWORD}@db.example/opencelium");
		context.putEnvironment("OC_MONGO_PASSWORD", "s3cret");
		console.type("y");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).contains("  |  MongoDB         mongodb://oc:****@db.example/opencelium")
				.doesNotContain("s3cret");
		assertThat(context.filePlan().files().get(0).content())
				.contains("uri: mongodb://oc:${OC_MONGO_PASSWORD}@db.example/opencelium").doesNotContain("s3cret");
		assertThat(context.filePlan().files().get(1).content()).endsWith("\nOC_MONGO_PASSWORD=s3cret\n");
	}

	@Test
	void runThrowsSetupCancelledWhenDeclined() {
		answered();
		console.type("n");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step().run(context, new ConsolePrompter(console)));

		assertThat(context.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runFailsWhenAnEarlierAnswerIsMissing() {
		assertThatIllegalStateException()
				.isThrownBy(() -> step().run(context, new ConsolePrompter(console)))
				.withMessageContaining("data directory");
	}

	private void answered() {
		context.setDataDir(Path.of("/srv/oc"));
		context.setPort(9090);
		context.setMongoUri("mongodb://localhost:27017/opencelium");
	}

	private SummaryStep step() {
		return new SummaryStep(new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium")));
	}

}
