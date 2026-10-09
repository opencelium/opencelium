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

import io.opencelium.core.setup.answers.AnswerSource;
import io.opencelium.core.setup.answers.AnswersFile;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The wizard with an answers file: a complete file gives the same files as a scripted run, byte for byte; an
 * absent key is asked; in non-interactive mode an absent or bad value stops the setup naming the key and the file,
 * and nothing is written.
 */
class WizardAnswersTest {

	private static final String REASON = "requested with setup";

	@TempDir
	Path tmp;

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private boolean started;

	private Path dataDir;

	private int port;

	@BeforeEach
	void answersOfThisRun() throws IOException {
		dataDir = tmp.resolve("data");
		try (ServerSocket socket = new ServerSocket(0)) {
			port = socket.getLocalPort();
		}
	}

	@Test
	void runMakesIdenticalFilesForAnswersFileAndScriptedRun() throws IOException {
		console.type(dataDir.toString(), String.valueOf(port), "");
		wizard(AnswerSource.PROMPTED, tmp.resolve("scripted")).run(REASON);
		Path file = answers("data-dir: " + dataDir + "\nport: " + port + "\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("from-file")).run(REASON);

		assertThat(exitCode).isEmpty();
		assertThat(console.output()).contains("  Data directory  " + dataDir + "   (from the answers file)")
				.contains("  Web port        " + port + "   (from the answers file)")
				.contains("  Write the files and start OpenCelium? yes   (non-interactive)");
		for (String name : new String[] {"application.yml", "opencelium.env"}) {
			assertThat(tmp.resolve("from-file/config/" + name))
					.hasSameBinaryContentAs(tmp.resolve("scripted/config/" + name));
		}
	}

	@Test
	void runAsksOnlyTheAbsentQuestion() throws IOException {
		Path file = answers("data-dir: " + dataDir + "\n");
		console.type(String.valueOf(port), "");

		OptionalInt exitCode = wizard(source(file, false), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).isEmpty();
		assertThat(console.output()).contains("  Data directory  " + dataDir + "   (from the answers file)")
				.contains("  Web port        [9090]: ").contains("  Write the files and start OpenCelium? [Y/n]: ")
				.doesNotContain("  Data directory  [");
		assertThat(tmp.resolve("work/config/application.yml")).content().contains("port: " + port);
		assertThat(started).isTrue();
	}

	@Test
	void runStopsNamingTheKeyWhenNonInteractiveAnswerIsAbsent() throws IOException {
		Path file = answers("data-dir: " + dataDir + "\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).hasValue(1);
		assertThat(console.output()).contains("  ! Missing answer: port in " + file);
		assertThat(tmp.resolve("work/config")).doesNotExist();
		assertThat(started).isFalse();
	}

	@Test
	void runStopsNamingTheKeyAndFileWhenFileValueIsBad() throws IOException {
		Path file = answers("data-dir: " + dataDir + "\nport: 70000\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).hasValue(1);
		assertThat(console.output()).contains("  ! Bad answer: port in " + file
				+ ": Please enter a port number between 1 and 65535.");
		assertThat(tmp.resolve("work/config")).doesNotExist();
		assertThat(started).isFalse();
	}

	@Test
	void runStopsNamingTheKeyWhenNonInteractiveAnswerIsBlank() throws IOException {
		// A blank value is absent, not the working directory, which the empty path would resolve to.
		Path file = answers("data-dir: \"\"\nport: " + port + "\n");

		OptionalInt exitCode = wizard(source(file, true), tmp.resolve("work")).run(REASON);

		assertThat(exitCode).hasValue(1);
		assertThat(console.output()).contains("  ! Missing answer: data-dir in " + file);
		assertThat(tmp.resolve("work/config")).doesNotExist();
	}

	private Path answers(String content) throws IOException {
		return Files.writeString(tmp.resolve("setup-answers.yml"), content);
	}

	private static AnswerSource source(Path file, boolean nonInteractive) {
		return new AnswerSource(AnswersFile.load(file), Optional.of(file), nonInteractive);
	}

	private Wizard wizard(AnswerSource answers, Path workingDir) {
		var locations = new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium"));
		return new Wizard(new ConsolePrompter(console), answers, Wizard.standardSteps(locations), () -> started = true,
				Optional.of("1.2.3"));
	}

}
