package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.host.CommandRunner;
import io.opencelium.core.setup.mongo.DockerComposeInstaller;
import io.opencelium.core.setup.mongo.MongoDetector;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.values.SetupValues;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.fake.FailingDnsClientProvider;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.entry;
import static org.assertj.core.api.Assertions.tuple;

/**
 * The MongoDB step: a server on the local port is the first option and the default; otherwise Docker Compose is,
 * when the host has it, and the user can type the URI of a server that exists. Docker Compose is only planned here,
 * with a generated password, and starts after the summary. Each typed answer is pinged before the step continues,
 * with the causes of the start ping,
 * and a failed ping offers to type the URI again, to continue, or to go back to the menu. A password in the URI
 * goes to the env file, and application.yml gets the placeholder. The tests that ping use the local MongoDB without
 * a Spring context, because the step runs before Spring starts; the others use a server that always answers.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class MongoStepTest {

	private static final Path FILE = Path.of("setup-values.yml");

	private static final CommandRunner NO_DOCKER = (directory, command) -> new CommandRunner.Result(1,
			"docker: 'compose' is not a docker command.");

	private static final CommandRunner DOCKER = (directory, command) -> new CommandRunner.Result(0,
			"Docker Compose version v2.29.1");

	/** Port 1 is closed on each test host, so the menu has no local server. */
	private static final MongoDetector NO_LOCAL_SERVER = new MongoDetector("localhost", 1, NO_DOCKER);

	private static final MongoDetector ONLY_DOCKER = new MongoDetector("localhost", 1, DOCKER);

	private static final Function<MongoConnection, Optional<String>> ANSWERS = connection -> Optional.empty();

	private static final Function<MongoConnection, Optional<String>> START_PING = new MongoStartupPing()::check;

	@TempDir
	Path workingDir;

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	private final SetupContext context = new SetupContext();

	@Test
	void runOffersLocalServerFirstWhenPortListens() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			int port = server.getLocalPort();
			console.type("");

			step(new MongoDetector("localhost", port, NO_DOCKER), ANSWERS).run(context, prompter);

			assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?",
					"1) Local server", "localhost:" + port, "2) Server URI", "3) Exit", "  Choice [1]: ");
			assertThat(context.mongoUri()).contains("mongodb://localhost:" + port + "/opencelium");
		}
	}

	@Test
	void runPingsBeforeItContinuesWhenUriIsTyped() {
		// The last line answers the password question when OC_TEST_MONGO_URI carries a login.
		console.type("", LocalMongo.uriFor(MongoStepTest.class), "");

		step(NO_LOCAL_SERVER, START_PING).run(context, prompter);

		assertThat(console.output()).containsSubsequence("1) Server URI", "2) Exit", "  Choice [1]: ",
				"  MongoDB URI     [", "  -> Pinging MongoDB at mongodb://", "  OK MongoDB answers at mongodb://");
		assertThat(console.output()).doesNotContain("Cannot use MongoDB");
		assertThat(context.mongoUri()).isPresent();
	}

	@Test
	void runNamesAuthenticationFailureWhenCredentialsAreWrong() {
		String database = LocalMongo.databaseFor(MongoStepTest.class);
		console.type("", LocalMongo.uriWithLogin("oc_nobody", "wrong-password", database));

		// The input ends at the retry menu, which cancels the setup.
		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(NO_LOCAL_SERVER, START_PING).run(context, prompter));

		assertThat(console.output()).contains("  ! Cannot use MongoDB at mongodb://oc_nobody:****@")
				.contains(": authentication failed for user 'oc_nobody'.")
				.containsSubsequence("1) Type the URI again", "2) Continue", "3) Back to the menu")
				.doesNotContain("wrong-password");
		assertThat(context.mongoUri()).isEmpty();
	}

	@Test
	void runOffersRetryMenuWhenPortIsClosed() {
		console.type("", "mongodb://oc:secret@localhost:1/opencelium", "2", "");

		step(NO_LOCAL_SERVER, START_PING).run(context, prompter);

		assertThat(console.output())
				.contains("  ! Cannot use MongoDB at mongodb://oc:****@localhost:1/opencelium: connection refused.")
				.containsSubsequence("  What now?", "1) Type the URI again", "2) Continue", "3) Back to the menu",
						"  Choice [1]: ", "OpenCelium does not start until MongoDB at mongodb://oc:****@localhost:1"
								+ "/opencelium answers.");
		assertThat(context.mongoUri()).contains("mongodb://oc:${OC_MONGO_PASSWORD}@localhost:1/opencelium");
		assertThat(context.environment()).containsExactly(entry("OC_MONGO_PASSWORD", "secret"));
	}

	@Test
	void runAsksTheUriAgainWhenRetryIsChosen() {
		console.type("", "mongodb://bad.example/opencelium", "1", "mongodb://db.example/opencelium");

		step(NO_LOCAL_SERVER, refusedBy("bad.example")).run(context, prompter);

		assertThat(console.output()).containsSubsequence("connection refused", "  What now?", "  MongoDB URI     [",
				"  OK MongoDB answers at mongodb://db.example/opencelium");
		assertThat(context.mongoUri()).contains("mongodb://db.example/opencelium");
	}

	@Test
	void runShowsTheMenuAgainWhenBackIsChosen() {
		console.type("", "mongodb://bad.example/opencelium", "3", "2");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(NO_LOCAL_SERVER, refusedBy("bad.example")).run(context, prompter));

		assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?", "  What now?",
				"  Which MongoDB does OpenCelium use?");
		assertThat(context.mongoUri()).isEmpty();
	}

	@Test
	void runAsksAgainWhenTheDnsLookupOfAnSrvAddressFails() {
		console.type("", "mongodb+srv://oc:s3cret@" + FailingDnsClientProvider.FAILING_HOST + "/opencelium",
				"mongodb://db.example/opencelium");

		step(NO_LOCAL_SERVER, ANSWERS).run(context, prompter);

		assertThat(console.output()).containsSubsequence("  ! '", FailingDnsClientProvider.FAILING_HOST,
				"  MongoDB URI     [", "  OK MongoDB answers at mongodb://db.example/opencelium")
				.doesNotContain("s3cret");
		assertThat(context.mongoUri()).contains("mongodb://db.example/opencelium");
	}

	@Test
	void runWarnsAndAsksAgainBeforePlainTextInYml() {
		console.type("", "mongodb://oc:s3cret@db.example/opencelium", "n", "n", "n", "y");

		step(NO_LOCAL_SERVER, ANSWERS).run(context, prompter);

		assertThat(console.output()).containsSubsequence("  Move the password to the env file? [Y/n]: ",
				"  ! application.yml is readable by its group", "  Write the password into application.yml? [y/N]: ",
				"  Move the password to the env file? [Y/n]: ", "  ! application.yml is readable by its group",
				"  Write the password into application.yml? [y/N]: ");
		assertThat(context.mongoUri()).contains("mongodb://oc:s3cret@db.example/opencelium");
		assertThat(context.environment()).isEmpty();
	}

	@Test
	void runPutsPasswordInEnvFileWhenTheMoveQuestionTakesItsDefault() {
		console.type("", "mongodb://oc:s3cret@db.example/opencelium", "");

		step(NO_LOCAL_SERVER, ANSWERS).run(context, prompter);

		assertThat(context.mongoUri()).contains("mongodb://oc:${OC_MONGO_PASSWORD}@db.example/opencelium");
		assertThat(context.environment()).containsExactly(entry("OC_MONGO_PASSWORD", "s3cret"));
	}

	@Test
	void runPutsPasswordInEnvFileWithoutAQuestionInBatchMode() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "uri",
				ValueKey.MONGO_URI, "mongodb://oc:s3cret@db.example/opencelium"));

		step(NO_LOCAL_SERVER, ANSWERS).run(batch, prompter);

		assertThat(batch.mongoUri()).contains("mongodb://oc:${OC_MONGO_PASSWORD}@db.example/opencelium");
		assertThat(batch.environment()).containsExactly(entry("OC_MONGO_PASSWORD", "s3cret"));
		assertThat(console.output()).contains("  MongoDB         uri   (from setup-values.yml)")
				.contains("  MongoDB URI     mongodb://oc:****@db.example/opencelium   (from setup-values.yml)")
				.doesNotContain("[Y/n]").doesNotContain("Choice [").doesNotContain("s3cret");
	}

	@Test
	void runStopsNamingTheKeyWhenTheServerOfTheFileDoesNotAnswer() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "uri",
				ValueKey.MONGO_URI, "mongodb://oc:s3cret@bad.example/opencelium"));

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(NO_LOCAL_SERVER, refusedBy("bad.example")).run(batch, prompter))
				.withMessage("Bad value: mongo-uri in setup-values.yml: Cannot use MongoDB at"
						+ " mongodb://oc:****@bad.example/opencelium: connection refused.");
		assertThat(batch.mongoUri()).isEmpty();
	}

	@Test
	void runStopsNamingTheKeyWhenTheFileNamesAnUnknownServer() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "postgres"));

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(NO_LOCAL_SERVER, ANSWERS).run(batch, prompter))
				.withMessage("Bad value: mongo in setup-values.yml: 'postgres' is not one of: local, docker, uri.");
	}

	@Test
	void questionsGiveTheTemplateTheServerAndTheUriWithTheDefaultsOfThisHost() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			int port = server.getLocalPort();

			assertThat(step(new MongoDetector("localhost", port, NO_DOCKER), ANSWERS).questions())
					.extracting(question -> question.key().word(), question -> question.defaultValue())
					.containsExactly(tuple("mongo", "local"),
							tuple("mongo-uri", "mongodb://localhost:" + port
									+ "/opencelium"));
		}
		assertThat(step(NO_LOCAL_SERVER, ANSWERS).questions().getFirst().defaultValue()).isEqualTo("uri");
		assertThat(step(ONLY_DOCKER, ANSWERS).questions().getFirst().defaultValue()).isEqualTo("docker");
		assertThat(step(ONLY_DOCKER, ANSWERS).questions().getFirst().help()).contains("docker");
	}

	@Test
	void runOffersThreeOptionsWhenNoServer() {
		console.type("3");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(ONLY_DOCKER, ANSWERS).run(context, prompter));

		assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?",
				"1) Docker Compose", "2) Server URI", "3) Exit", "  Choice [1]: ");
		assertThat(context.filePlan().actions()).isEmpty();
	}

	@Test
	void runHidesDockerOptionWhenDockerIsAbsent() {
		console.type("2");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(NO_LOCAL_SERVER, ANSWERS).run(context, prompter));

		assertThat(console.output()).containsSubsequence("1) Server URI", "2) Exit", "  Choice [1]: ")
				.doesNotContain("Docker Compose");
	}

	@Test
	void runHidesDockerOptionWhenALocalServerListens() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			console.type("");

			// The compose file publishes the local port, which the server holds already.
			step(new MongoDetector("localhost", server.getLocalPort(), DOCKER), ANSWERS).run(context, prompter);

			assertThat(console.output()).containsSubsequence("1) Local server", "2) Server URI", "3) Exit")
					.doesNotContain("Docker Compose");
			assertThat(context.filePlan().actions()).isEmpty();
		}
	}

	@Test
	void runPlansDockerComposeWithAGeneratedPasswordWhenDockerIsChosen() {
		console.type("");

		step(ONLY_DOCKER, ANSWERS).run(context, prompter);

		assertThat(context.mongoUri()).contains(DockerComposeInstaller.URI);
		assertThat(context.environment()).containsOnlyKeys("OC_MONGO_PASSWORD");
		String password = context.environment().get("OC_MONGO_PASSWORD");
		assertThat(password).matches("[A-Za-z0-9-]{20}");
		assertThat(context.filePlan().actions()).singleElement().extracting(PlannedAction::description)
				.isEqualTo("Start MongoDB with Docker Compose in " + workingDir.resolve("quickstart"));
		assertThat(context.filePlan().files()).extracting(PlannedFile::path).containsExactly(
				workingDir.resolve("quickstart/docker-compose.yml"), workingDir.resolve("quickstart/.env"));
		// The step only plans: the summary decides, and the plan writes and starts after it.
		assertThat(workingDir.resolve("quickstart")).doesNotExist();
		assertThat(console.output()).doesNotContain(password).doesNotContain("Move the password");
	}

	@Test
	void runPlansDockerComposeWithoutAQuestionWhenTheFileSaysDocker() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "docker"));

		step(ONLY_DOCKER, ANSWERS).run(batch, prompter);

		assertThat(batch.mongoUri()).contains(DockerComposeInstaller.URI);
		assertThat(batch.environment()).containsOnlyKeys("OC_MONGO_PASSWORD");
		assertThat(batch.filePlan().actions()).hasSize(1);
		assertThat(console.output()).contains("  MongoDB         docker   (from setup-values.yml)")
				.doesNotContain("Choice [");
	}

	@Test
	void runStopsNamingTheKeyWhenTheFileSaysDockerAndDockerIsAbsent() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "docker"));

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(NO_LOCAL_SERVER, ANSWERS).run(batch, prompter))
				.withMessageStartingWith("Bad value: mongo in setup-values.yml: ")
				.withMessageContaining("docker compose version");
		assertThat(batch.filePlan().actions()).isEmpty();
	}

	@Test
	void runStopsNamingTheKeyWhenTheFileSaysDockerAndALocalServerListens() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			SetupContext batch = batch(Map.of(ValueKey.MONGO, "docker"));
			var detector = new MongoDetector("localhost", server.getLocalPort(), DOCKER);

			assertThatExceptionOfType(SetupFailedException.class)
					.isThrownBy(() -> step(detector, ANSWERS).run(batch, prompter))
					.withMessageStartingWith("Bad value: mongo in setup-values.yml: ")
					.withMessageContaining("localhost:" + server.getLocalPort());
			assertThat(batch.filePlan().actions()).isEmpty();
		}
	}

	private MongoStep step(MongoDetector detector, Function<MongoConnection, Optional<String>> ping) {
		return new MongoStep(detector, ping, new DockerComposeInstaller(workingDir.resolve("quickstart")));
	}

	private static SetupContext batch(Map<ValueKey, String> values) {
		return new SetupContext(new ValueSource(new SetupValues(values), Optional.of(FILE), true));
	}

	/** A ping that answers for each server except the one on {@code host}. */
	private static Function<MongoConnection, Optional<String>> refusedBy(String host) {
		return connection -> connection.connectionString().getHosts().getFirst().startsWith(host)
				? Optional.of("connection refused") : Optional.empty();
	}

}
