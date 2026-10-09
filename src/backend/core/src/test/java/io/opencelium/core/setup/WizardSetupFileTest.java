package io.opencelium.core.setup;

import java.io.IOException;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.OptionalInt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.values.SetupFile;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The wizard with a setup file: a complete file gives the same files as a scripted run, byte for byte; an
 * absent key is asked; in non-interactive mode an absent or bad value stops the setup naming the key and the file,
 * and nothing is written.
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
				.contains("  Write the files and start OpenCelium? yes   (non-interactive)");
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
				.contains("  Web port        [9090]: ").contains("  Write the files and start OpenCelium? [Y/n]: ")
				.doesNotContain("  Data directory  [");
		assertThat(tmp.resolve("work/config/application.yml")).content().contains("port: " + port);
		assertThat(started).isTrue();
	}

	@Test
	void runStopsNamingTheKeyWhenNonInteractiveValueIsAbsent() throws IOException {
		Path file = setupFile("data-dir: " + dataDir + "\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).hasValue(1);
		assertThat(console.output()).contains("  ! Missing value: port in " + file);
		assertThat(tmp.resolve("work/config")).doesNotExist();
		assertThat(started).isFalse();
	}

	@Test
	void runStopsNamingTheKeyAndFileWhenFileValueIsBad() throws IOException {
		Path file = setupFile("data-dir: " + dataDir + "\nport: 70000\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).hasValue(1);
		assertThat(console.output()).contains("  ! Bad value: port in " + file
				+ ": Please enter a port number between 1 and 65535.");
		assertThat(tmp.resolve("work/config")).doesNotExist();
		assertThat(started).isFalse();
	}

	@Test
	void runStopsNamingTheKeyWhenNonInteractiveValueIsBlank() throws IOException {
		// A blank value is absent, not the working directory, which the empty path would resolve to.
		Path file = setupFile("data-dir: \"\"\nport: " + port + "\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).hasValue(1);
		assertThat(console.output()).contains("  ! Missing value: data-dir in " + file);
		assertThat(tmp.resolve("work/config")).doesNotExist();
	}

	private Path setupFile(String content) throws IOException {
		return Files.writeString(tmp.resolve("setup-values.yml"), content);
	}

	private static ValueSource source(Path file, boolean nonInteractive) {
		return new ValueSource(SetupFile.load(file), Optional.of(file), nonInteractive);
	}

	private Wizard wizard(ValueSource values, Path workingDir) {
		var locations = new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium"));
		return new Wizard(new ConsolePrompter(console), values, Wizard.standardSteps(locations), () -> started = true,
				Optional.of("1.2.3"));
	}

}
