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

import static io.opencelium.core.testsupport.fixture.ComposePullEvents.downloadComplete;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.downloading;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.error;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.pulled;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.pulling;
import static io.opencelium.core.testsupport.fixture.ComposePullEvents.waiting;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The Docker Compose installer as an action of the plan: its compose file and its {@code .env} are written with the
 * other files of the plan, then {@code docker compose pull} downloads the image with a progress bar, {@code docker
 * compose up -d} runs in the quickstart directory, and the action pings until MongoDB accepts the login. A failure
 * stops the container, removes the volume when this run made it, and the rollback of the plan removes the files. The
 * commands go to a fake runner and the ping is a fake, so no test needs Docker.
 */
class DockerComposeInstallerTest {

	private static final String FAKE_PASSWORD = "Gen3rated-Passw0rd";

	private static final String VOLUME_INSPECT = "docker volume inspect opencelium_mongo-data";

	private static final String PULL = "docker compose -p opencelium -f docker-compose.yml --env-file .env"
			+ " --progress json pull --policy missing";

	private static final String UP = "docker compose -p opencelium -f docker-compose.yml --env-file .env up -d";

	private static final String DOWN = "docker compose -p opencelium -f docker-compose.yml --env-file .env down";

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
				.doesNotContain(FAKE_PASSWORD);
		assertThat(quickstart().resolve(".env")).content().contains("\nOC_MONGO_PASSWORD=" + FAKE_PASSWORD + "\n");
		assumeTrue(FileSystems.getDefault().supportedFileAttributeViews().contains("posix"), "POSIX permissions");
		assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(quickstart().resolve(".env"))))
				.isEqualTo("rw-------");
	}

	@Test
	void installRunsNothingWhenThePlanIsNotWritten() {
		var plan = new FilePlan();

		plan.add(installer(ANSWERS, Duration.ofSeconds(60)).install(FAKE_PASSWORD, new ConsolePrompter(console)));

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
		assertThat(commandsAtEachPing.getFirst()).endsWith(UP);
		assertThat(commands.directories()).containsOnly(quickstart());
		assertThat(pinged.getFirst().redacted())
				.isEqualTo("mongodb://opencelium:****@127.0.0.1:27017/opencelium?authSource=admin");
		assertThat(pinged.getFirst().connectionString().getPassword()).containsExactly(FAKE_PASSWORD.toCharArray());
		assertThat(console.output()).containsSubsequence(
				"  -> Starting MongoDB with Docker Compose in " + quickstart(),
				"  OK MongoDB answers at mongodb://opencelium:****@127.0.0.1:27017/opencelium?authSource=admin")
				.doesNotContain(FAKE_PASSWORD);
	}

	@Test
	void installStopsTheContainerAndRemovesItsFilesWhenComposeUpFails() {
		commands.answer(VOLUME_INSPECT, 1, "Error response from daemon: get opencelium_mongo-data: no such volume\n")
				.answer(UP, 1, "Pulling mongo\nError: Bind for 127.0.0.1:27017 failed: port is"
						+ " already allocated\n");

		assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> write(installer(ANSWERS, Duration.ofSeconds(60))))
				.withMessageContaining(UP).withMessageContaining("exit code 1")
				.withMessageContaining("port is already allocated")
				.satisfies(ex -> assertThat(ex.rollbackReport()).isEqualTo("Nothing was written."));
		assertThat(commands.commands()).endsWith(DOWN + " -v");
		assertThat(quickstart()).doesNotExist();
	}

	@Test
	void installRemovesTheVolumeItMadeWhenMongoDbDoesNotAnswer() {
		commands.answer(VOLUME_INSPECT, 1, "no such volume\n");

		assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> write(installer(NEVER_ANSWERS, Duration.ZERO)))
				.withMessageContaining("connection refused").withMessageNotContaining(FAKE_PASSWORD);
		assertThat(commands.commands()).containsExactly(VOLUME_INSPECT, PULL, UP, DOWN + " -v");
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
		assertThat(commands.commands()).containsExactly(VOLUME_INSPECT, PULL, UP, DOWN);
	}

	@Test
	void installShowsTheProgressBarWhenComposePullsTheImage() {
		commands.answer(PULL, 0, String.join("\n", pulling(), waiting("a1"), waiting("b2"),
				downloading("a1", 30_000_000, 60_000_000), downloading("b2", 10_000_000, 40_000_000),
				downloadComplete("a1"), downloadComplete("b2"), pulled()));

		write(installer(ANSWERS, Duration.ofSeconds(60)));

		assertThat(commands.commands()).containsExactly(VOLUME_INSPECT, PULL, UP);
		// The bar moves while the pull runs, so the installer takes the lines through the call that streams them.
		assertThat(commands.streamed()).containsExactly(PULL);
		assertThat(console.output()).containsSubsequence(
				"  -> Starting MongoDB with Docker Compose in " + quickstart(),
				"  -> Downloading the image mongo:8",
				"    [############------------]  30.0 of 60.0 MB  50%",
				"    [########################]  100.0 of 100.0 MB  100%",
				"  OK MongoDB answers at");
	}

	@Test
	void installShowsNoBarWhenTheHostHasTheImage() {
		// With the image on the host, the pull downloads nothing and gives no layer event.
		commands.answer(PULL, 0, String.join("\n", pulling(), pulled()));

		write(installer(ANSWERS, Duration.ofSeconds(60)));

		assertThat(commands.commands()).containsExactly(VOLUME_INSPECT, PULL, UP);
		assertThat(console.output()).doesNotContain("Downloading").contains("  OK MongoDB answers at");
	}

	@Test
	void installStopsWithTheCauseFromDockerWhenThePullFails() {
		commands.answer(VOLUME_INSPECT, 1, "no such volume\n").answer(PULL, 1, String.join("\n", pulling(),
				error("toomanyrequests: You have reached your unauthenticated pull rate limit")));

		assertThatExceptionOfType(SetupWriteException.class)
				.isThrownBy(() -> write(installer(ANSWERS, Duration.ofSeconds(60))))
				.withMessageContaining("Cannot download the image mongo:8")
				.withMessageContaining("toomanyrequests: You have reached your unauthenticated pull rate limit")
				.satisfies(ex -> assertThat(ex.rollbackReport()).isEqualTo("Nothing was written."));
		assertThat(commands.commands()).doesNotContain(UP);
		assertThat(quickstart()).doesNotExist();
	}

	@Test
	void installStartsWithoutABarWhenThePullGivesNoJson() {
		// An older Docker Compose knows no JSON progress; up -d then downloads the image as before.
		commands.answer(PULL, 1, "unknown flag: --progress\n");

		write(installer(ANSWERS, Duration.ofSeconds(60)));

		assertThat(commands.commands()).containsExactly(VOLUME_INSPECT, PULL, UP);
		assertThat(console.output()).doesNotContain("Downloading").contains("  OK MongoDB answers at");
	}

	private DockerComposeInstaller installer(Function<MongoConnection, Optional<String>> ping, Duration timeout) {
		return new DockerComposeInstaller(quickstart(), commands, ping, timeout, Duration.ZERO);
	}

	/** The plan of a run that chose Docker Compose: the action and its files, written by the writer of the plan. */
	private void write(DockerComposeInstaller installer) {
		var plan = new FilePlan();
		plan.add(installer.install(FAKE_PASSWORD, new ConsolePrompter(console)));
		writer.write(plan);
	}

	private Path quickstart() {
		return workingDir.resolve("quickstart");
	}

}
