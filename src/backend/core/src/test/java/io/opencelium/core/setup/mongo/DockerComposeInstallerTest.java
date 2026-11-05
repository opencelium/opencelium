package io.opencelium.core.setup.mongo;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.setup.files.FilePlan;
import io.opencelium.core.setup.files.FilePlanWriter;
import io.opencelium.core.setup.files.SetupWriteException;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.RecordingCommandRunner;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The Docker Compose installer as an action of the plan: its compose file and its {@code .env} are written with the
 * other files of the plan, then {@code docker compose up -d} runs in the quickstart directory, and the action pings
 * until MongoDB accepts the login. A failure stops the container, removes the volume when this run made it, and the
 * rollback of the plan removes the files. The commands go to a fake runner and the ping is a fake, so no test needs
 * Docker.
 */
class DockerComposeInstallerTest {

	private static final String PASSWORD = "Gen3rated-Passw0rd";

	private static final String VOLUME_INSPECT = "docker volume inspect opencelium_mongo-data";

	private static final Function<MongoConnection, Optional<String>> ANSWERS = connection -> Optional.empty();

	private static final Function<MongoConnection, Optional<String>> NEVER_ANSWERS =
			connection -> Optional.of("connection refused");

	@TempDir
	Path workingDir;

	private final RecordingCommandRunner commands = new RecordingCommandRunner();

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final FilePlanWriter writer = new FilePlanWriter(line -> {
	});

	@Test
	void installWritesComposeFileAndEnvFile() throws IOException {
		write(installer(ANSWERS, Duration.ofSeconds(60)));

		// The project name and the volume name are fixed, so the inspect and the undo name the volume of the file.
		assertThat(quickstart().resolve("docker-compose.yml")).content().contains("\nname: opencelium\n")
				.contains("    name: opencelium_mongo-data\n").contains("image: mongo:8")
				.contains("\"127.0.0.1:27017:27017\"").contains("MONGO_INITDB_ROOT_USERNAME: opencelium")
				.contains("MONGO_INITDB_ROOT_PASSWORD: ${OC_MONGO_PASSWORD").contains("mongo-data:/data/db")
				.doesNotContain(PASSWORD);
		assertThat(quickstart().resolve(".env")).content().contains("\nOC_MONGO_PASSWORD=" + PASSWORD + "\n");
		assumeTrue(FileSystems.getDefault().supportedFileAttributeViews().contains("posix"), "POSIX permissions");
		assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(quickstart().resolve(".env"))))
				.isEqualTo("rw-------");
	}

	@Test
	void installRunsNothingWhenThePlanIsNotWritten() {
		var plan = new FilePlan();

		plan.add(installer(ANSWERS, Duration.ofSeconds(60)).install(PASSWORD, new ConsolePrompter(console)));

		assertThat(plan.actions()).singleElement().satisfies(action -> assertThat(action.description())
				.isEqualTo("Start MongoDB with Docker Compose in " + quickstart()));
		assertThat(commands.commands()).isEmpty();
		assertThat(quickstart()).doesNotExist();
		assertThat(console.output()).isEmpty();
	}

	@Test
	void installRunsComposeUpThenPings() {
		List<List<String>> commandsAtEachPing = new ArrayList<>();
		List<MongoConnection> pinged = new ArrayList<>();
		Function<MongoConnection, Optional<String>> answersAtTheThirdPing = connection -> {
			commandsAtEachPing.add(commands.commands());
			pinged.add(connection);
			return pinged.size() < 3 ? Optional.of("connection refused") : Optional.empty();
		};

		write(installer(answersAtTheThirdPing, Duration.ofSeconds(60)));

		assertThat(commandsAtEachPing).hasSize(3);
		assertThat(commandsAtEachPing.getFirst()).endsWith("docker compose up -d");
		assertThat(commands.directories()).containsOnly(quickstart());
		assertThat(pinged.getFirst().redacted())
				.isEqualTo("mongodb://opencelium:****@127.0.0.1:27017/opencelium?authSource=admin");
		assertThat(pinged.getFirst().connectionString().getPassword()).containsExactly(PASSWORD.toCharArray());
		assertThat(console.output()).containsSubsequence(
				"  -> Starting MongoDB with Docker Compose in " + quickstart(),
				"  OK MongoDB answers at mongodb://opencelium:****@127.0.0.1:27017/opencelium?authSource=admin")
				.doesNotContain(PASSWORD);
	}

	@Test
	void installStopsTheContainerAndRemovesItsFilesWhenComposeUpFails() {
		commands.answer(VOLUME_INSPECT, 1, "Error response from daemon: get opencelium_mongo-data: no such volume\n")
				.answer("docker compose up -d", 1, "Pulling mongo\nError: Bind for 127.0.0.1:27017 failed: port is"
						+ " already allocated\n");

		assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> write(installer(ANSWERS, Duration.ofSeconds(60))))
				.withMessageContaining("docker compose up -d").withMessageContaining("exit code 1")
				.withMessageContaining("port is already allocated")
				.satisfies(ex -> assertThat(ex.rollbackReport()).isEqualTo("Nothing was written."));
		assertThat(commands.commands()).endsWith("docker compose down -v");
		assertThat(quickstart()).doesNotExist();
	}

	@Test
	void installRemovesTheVolumeItMadeWhenMongoDbDoesNotAnswer() {
		commands.answer(VOLUME_INSPECT, 1, "no such volume\n");

		assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> write(installer(NEVER_ANSWERS, Duration.ZERO)))
				.withMessageContaining("connection refused").withMessageNotContaining(PASSWORD);
		assertThat(commands.commands()).containsExactly(VOLUME_INSPECT, "docker compose up -d",
				"docker compose down -v");
		assertThat(quickstart()).doesNotExist();
	}

	@Test
	void installKeepsAVolumeThatExistedBeforeWhenItRollsBack() {
		Function<MongoConnection, Optional<String>> earlierPassword =
				connection -> Optional.of("authentication failed for user 'opencelium'");

		assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> write(installer(earlierPassword, Duration.ZERO)))
				.withMessageContaining("authentication failed for user 'opencelium'")
				.withMessageContaining("opencelium_mongo-data");
		assertThat(commands.commands()).containsExactly(VOLUME_INSPECT, "docker compose up -d",
				"docker compose down");
	}

	private DockerComposeInstaller installer(Function<MongoConnection, Optional<String>> ping, Duration timeout) {
		return new DockerComposeInstaller(quickstart(), commands, ping, timeout, Duration.ZERO);
	}

	/** The plan of a run that chose Docker Compose: the action and its files, written by the writer of the plan. */
	private void write(DockerComposeInstaller installer) {
		var plan = new FilePlan();
		plan.add(installer.install(PASSWORD, new ConsolePrompter(console)));
		writer.write(plan);
	}

	private Path quickstart() {
		return workingDir.resolve("quickstart");
	}

}
