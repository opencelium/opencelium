package io.opencelium.core.setup;

import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.values.SetupFile;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;
import io.opencelium.core.testsupport.fake.NamedStep;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The wizard with a setup file: a complete file gives the same files as a scripted run, byte for byte; an
 * absent key is asked; in batch mode an absent or bad value stops the setup with an exception that names
 * the key and the file, which the launcher prints on standard error, and nothing is written.
 */
class WizardSetupFileTest {

	private static final String REASON = "requested with setup";

	@TempDir
	Path tmp;

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private boolean started;

	private Path dataDir;

	private int port;

	@BeforeEach
	void valuesOfThisRun() throws IOException {
		dataDir = tmp.resolve("data");
		try (ServerSocket socket = new ServerSocket(0)) {
			port = socket.getLocalPort();
		}
	}

	@Test
	void runMakesIdenticalFilesForSetupFileAndScriptedRun() throws IOException {
		console.type(dataDir.toString(), String.valueOf(port), "");
		wizard(ValueSource.PROMPTED, tmp.resolve("scripted")).run(REASON);
		Path file = setupFile("data-dir: " + dataDir + "\nport: " + port + "\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("from-file")).run(REASON);

		assertThat(exitCode).isEmpty();
		assertThat(console.output()).contains("  Data directory  " + dataDir + "   (from " + file + ")")
				.contains("  Web port        " + port + "   (from " + file + ")")
				.contains("  Write the files? yes   (batch)");
		for (String name : new String[] {"application.yml", "opencelium.env"}) {
			assertThat(tmp.resolve("from-file/config/" + name))
					.hasSameBinaryContentAs(tmp.resolve("scripted/config/" + name));
		}
	}

	@Test
	void runAsksOnlyTheAbsentQuestion() throws IOException {
		Path file = setupFile("data-dir: " + dataDir + "\n");
		console.type(String.valueOf(port), "");

		OptionalInt exitCode = wizard(source(file, false), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).isEmpty();
		assertThat(console.output()).contains("  Data directory  " + dataDir + "   (from " + file + ")")
				.contains("  Web port        [9090]: ").contains("  Write the files? [Y/n]: ")
				.doesNotContain("  Data directory  [");
		assertThat(tmp.resolve("work/config/application.yml")).content().contains("port: " + port);
		assertThat(started).isTrue();
	}

	@Test
	void runStopsNamingTheKeyWhenBatchValueIsAbsent() throws IOException {
		Path file = setupFile("data-dir: " + dataDir + "\n");

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> wizard(source(file, true), tmp.resolve("work")).run(REASON)).actual();

		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).isEqualTo("Missing value: port in " + file
				+ "\nA template with every key: java -jar oc-app.jar setup --template");
		assertThat(console.output()).doesNotContain("Missing value");
		assertThat(tmp.resolve("work/config")).doesNotExist();
		assertThat(started).isFalse();
	}

	@Test
	void runStopsNamingTheKeyAndFileWhenFileValueIsBad() throws IOException {
		Path file = setupFile("data-dir: " + dataDir + "\nport: 70000\n");

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> wizard(source(file, true), tmp.resolve("work")).run(REASON))
				.withMessage("Bad value: port in " + file + ": Please enter a port number between 1 and 65535.");

		assertThat(tmp.resolve("work/config")).doesNotExist();
		assertThat(started).isFalse();
	}

	@Test
	void runStopsNamingTheKeyWhenBatchValueIsBlank() throws IOException {
		// A blank value is absent, not the working directory, which the empty path would resolve to.
		Path file = setupFile("data-dir: \"\"\nport: " + port + "\n");

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> wizard(source(file, true), tmp.resolve("work")).run(REASON))
				.withMessageStartingWith("Missing value: data-dir in " + file);

		assertThat(tmp.resolve("work/config")).doesNotExist();
	}

	private Path setupFile(String content) throws IOException {
		return Files.writeString(tmp.resolve("setup-values.yml"), content);
	}

	private static ValueSource source(Path file, boolean batch) {
		return new ValueSource(SetupFile.load(file), Optional.of(file), batch);
	}

	/**
	 * The steps of a full setup, with a MongoDB step that answers without a question: the MongoDB keys of the setup
	 * file have their own tests, and these tests do not depend on a server on this host.
	 */
	private Wizard wizard(ValueSource values, Path workingDir) {
		var locations = new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium"));
		SetupStep mongo = new NamedStep("MongoDB",
				(context, prompter) -> context.setMongoUri("mongodb://localhost:27017/opencelium"));
		List<SetupStep> steps = List.of(new DataDirStep(), new PortStep(), mongo, new SummaryStep(locations));
		return new Wizard(new ConsolePrompter(console), values, steps, environment -> started = true,
				Optional.of("1.2.3"));
	}

}
