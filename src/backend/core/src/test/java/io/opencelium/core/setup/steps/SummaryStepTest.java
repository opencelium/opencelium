package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.setup.ConfigLocations;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.values.EnvironmentSnapshot;
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
 * that will be written as a list, the actions after the write with the start last, and the question whether to write
 * the files. Yes plans application.yml and the env file, with the entries of the env file; no cancels the setup. A
 * value from the environment shows its variable, the summary tells to keep each such variable, and no file holds the
 * value: a MongoDB connection of {@code SPRING_MONGODB_} variables gets no line, and one of {@code OC_MONGO_URI}
 * keeps only the placeholder.
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

		assertThat(console.output()).containsSubsequence("  +-- Your answers --",
				"  |  Mode" + " ".repeat(12) + "self-host", "  |  Data directory  /srv/oc", "  |  Web port        9090",
				"  +--");
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
				"  Write the files? [Y/n]: ");
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
				"    - Install the service opencelium", "    - Start OpenCelium",
				"  Write the files? [Y/n]: ");
		assertThat(context.filePlan().files()).extracting(PlannedFile::path).containsExactly(
				workingDir.resolve("config/application.yml"), workingDir.resolve("config/opencelium.env"), unit);
	}

	@Test
	void runAsksToWriteTheFilesWithoutTheStart() {
		answered();
		console.type("y");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).contains("\n  Write the files? [Y/n]: ")
				.doesNotContain("start OpenCelium?");
	}

	@Test
	void runListsTheStartAfterThePlannedActionsWhenAStepPlannedAnAction() {
		answered();
		context.filePlan().add(new RecordingAction("Write a new master key", new ArrayList<>()));
		console.type("y");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).contains("  After the write\n    - Write a new master key\n"
				+ "    - Start OpenCelium\n\n  Write the files? [Y/n]: ");
	}

	@Test
	void runListsTheStartAfterTheWriteWhenNoStepPlannedAnAction() {
		answered();
		console.type("y");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output())
				.contains("  After the write\n    - Start OpenCelium\n\n  Write the files? [Y/n]: ");
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
		assertThat(console.output()).contains("  Write the files? yes   (batch)")
				.doesNotContain("[Y/n]");
	}

	@Test
	void runPutsTheWholeUriIntoTheEnvFileAndItsPlaceholderIntoTheYmlFile() {
		answered();
		context.setMongoUri("mongodb://oc:s3cr%40t@db.example/opencelium?authSource=admin");
		console.type("y");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).contains("  |  MongoDB         mongodb://oc:****@db.example/opencelium")
				.doesNotContain("s3cr");
		assertThat(context.filePlan().files().get(0).content()).contains("uri: ${OC_MONGO_URI}\n")
				.doesNotContain("s3cr").doesNotContain("db.example");
		// The percent-encoding stays as typed.
		assertThat(context.filePlan().files().get(1).content())
				.endsWith("\nOC_MONGO_URI=\"mongodb://oc:s3cr%40t@db.example/opencelium?authSource=admin\"\n");
		// The start in the wizard process gets the entries of the env file as its arguments.
		assertThat(context.environment())
				.containsEntry("OC_MONGO_URI", "mongodb://oc:s3cr%40t@db.example/opencelium?authSource=admin");
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

	@Test
	void runShowsWhereTheMasterKeyComesFrom() {
		answered();
		context.setMasterKey("the key file /keys/master.key", Optional.of(Path.of("/keys/master.key")));
		console.type("");

		step().run(context, new ConsolePrompter(console));

		assertThat(console.output()).contains("  |  Master key      the key file /keys/master.key");
	}

	@Test
	void runPutsTheKeyFileIntoApplicationYml() {
		answered();
		context.setMasterKey("the key file /keys/master.key", Optional.of(Path.of("/keys/master.key")));
		console.type("");

		step().run(context, new ConsolePrompter(console));

		assertThat(context.filePlan().files()).filteredOn(file -> file.path().endsWith("application.yml"))
				.singleElement().satisfies(file -> assertThat(file.content())
						.contains("master-key-file: /keys/master.key"));
	}

	@Test
	void runTellsToKeepTheVariablesWhenValuesComeFromTheEnvironment() {
		SetupContext fromVariables = answeredFrom(Map.of("SERVER_PORT", "8080", "OPENCELIUM_DATADIR", "/srv/oc"));
		console.type("y");

		step().run(fromVariables, new ConsolePrompter(console));

		// A later start without a variable takes the default, not the value that the box shows.
		assertThat(console.output()).containsSubsequence("  |  Data directory  /srv/oc   (from OPENCELIUM_DATADIR)",
				"  |  Web port        8080   (from SERVER_PORT)", "  +--",
				"  Keep these variables for each later start: OPENCELIUM_DATADIR, SERVER_PORT.\n"
						+ "  Set them in the shell or in the environment of the service. A later start\n"
						+ "  without a variable uses the default, not the value above.\n",
				"  Write the files? [Y/n]: ");
	}

	@Test
	void runPlansNoLineAndNoEntryForTheValuesFromTheEnvironment() {
		SetupContext fromVariables = answeredFrom(Map.of("OPENCELIUM_DEPLOYMENTMODE", "self-host", "SERVER_PORT",
				"8080", "OPENCELIUM_DATADIR", "/srv/oc"));
		console.type("y");

		step().run(fromVariables, new ConsolePrompter(console));

		// The environment stays the only source: a copy in a file would apply when the variable is gone.
		assertThat(console.output()).contains("  |  Mode            self-host   (from OPENCELIUM_DEPLOYMENTMODE)");
		assertThat(fromVariables.filePlan().files().get(0).content()).doesNotContain("port:")
				.doesNotContain("data-dir:").doesNotContain("deployment-mode:").contains("uri: ${OC_MONGO_URI}\n");
		assertThat(fromVariables.environment()).containsOnlyKeys("OC_MONGO_URI");
	}

	@Test
	void runWritesNoMongoLineAndNoEnvEntryWhenTheUriComesFromTheVariable() {
		String uri = "mongodb://oc:s3cret@db.example/oc_variable";
		SetupContext fromVariables = connectedFrom("SPRING_MONGODB_URI", uri, Map.of());
		console.type("y");

		step().run(fromVariables, new ConsolePrompter(console));

		// The variable gives the property itself: a line or an entry would apply at a later start without it.
		assertThat(fromVariables.filePlan().files().get(0).content()).doesNotContain("mongodb")
				.doesNotContain("OC_MONGO_URI");
		assertThat(fromVariables.filePlan().files().get(1).content()).doesNotContain("OC_MONGO_URI");
		assertThat(fromVariables.environment()).isEmpty();
		assertThat(console.output()).contains("mongodb://oc:****@db.example/oc_variable   (from SPRING_MONGODB_URI)",
				"Keep these variables for each later start: SPRING_MONGODB_URI.").doesNotContain("s3cret");
	}

	@Test
	void runKeepsThePlaceholderWithoutEntryWhenOcMongoUriIsSet() {
		SetupContext fromVariables = connectedFrom("OC_MONGO_URI", "mongodb://db.example/oc_placeholder", Map.of());
		console.type("y");

		step().run(fromVariables, new ConsolePrompter(console));

		// The variable gives the value of the placeholder, so the line stays, and the env file holds no copy.
		assertThat(fromVariables.filePlan().files().get(0).content()).contains("uri: ${OC_MONGO_URI}\n");
		assertThat(fromVariables.filePlan().files().get(1).content()).doesNotContain("OC_MONGO_URI");
		assertThat(fromVariables.environment()).isEmpty();
		assertThat(console.output()).contains("(from OC_MONGO_URI)",
				"Keep these variables for each later start: OC_MONGO_URI.");
	}

	@Test
	void runWritesTheEnvFileWithTheHeaderOnlyWhenNoEntryIsLeft() {
		SetupContext fromVariables = connectedFrom("SPRING_MONGODB_URI", "mongodb://db.example/oc_variable",
				Map.of("OC_MASTER_KEY", "not shown"));
		fromVariables.setMasterKeyFromVariable("the variable OC_MASTER_KEY", "OC_MASTER_KEY");
		console.type("y");

		step().run(fromVariables, new ConsolePrompter(console));

		// systemd needs the file that EnvironmentFile names, and the new file replaces an old OC_MONGO_URI.
		assertThat(fromVariables.filePlan().files().get(1).path()).hasFileName("opencelium.env");
		assertThat(fromVariables.filePlan().files().get(1).content().lines()).singleElement().asString()
				.startsWith("# ");
		assertThat(console.output()).contains("Keep these variables for each later start: SPRING_MONGODB_URI,"
				+ " OC_MASTER_KEY.");
	}

	/**
	 * The answers of the earlier steps, with a MongoDB connection that {@code variable} of the setup environment gives,
	 * and {@code more} variables.
	 */
	private static SetupContext connectedFrom(String variable, String uri, Map<String, String> more) {
		var variables = new HashMap<>(more);
		variables.put(variable, uri);
		var fromVariables = new SetupContext(new ValueSource(SetupValues.NONE, Optional.empty(), false,
				new EnvironmentSnapshot(variables)));
		fromVariables.setDataDir(Path.of("/srv/oc"));
		fromVariables.setPort(9090);
		fromVariables.setMongoConnection(StaticMongoConnectionResolver.parseUri(uri), List.of(variable));
		return fromVariables;
	}

	/** The answers of the earlier steps, with the setup environment that gives some of them. */
	private static SetupContext answeredFrom(Map<String, String> variables) {
		var fromVariables = new SetupContext(new ValueSource(SetupValues.NONE, Optional.empty(), false,
				new EnvironmentSnapshot(variables)));
		fromVariables.setDataDir(Path.of("/srv/oc"));
		fromVariables.setPort(8080);
		fromVariables.setMongoUri("mongodb://localhost:27017/opencelium");
		return fromVariables;
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
