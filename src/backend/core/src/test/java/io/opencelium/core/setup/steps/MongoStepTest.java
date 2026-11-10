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

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
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
import static org.assertj.core.api.Assertions.tuple;

/**
 * The MongoDB step: a server on the local port is the first option and the default, and the user can type the URI
 * of a server that exists. The step starts no MongoDB. Each typed answer is pinged before the step continues, with
 * the causes of the start ping, and a failed ping offers to type the URI again, to continue, or to go back to the
 * menu. The step keeps the whole URI, also with a database password, and asks nothing about it. The tests
 * that ping use the local MongoDB without a Spring context, because the step runs before Spring starts; the others
 * use a server that always answers.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class MongoStepTest {

	private static final Path FILE = Path.of("setup-values.yml");

	private static final Function<MongoConnection, Optional<String>> ANSWERS = connection -> Optional.empty();

	private static final Function<MongoConnection, Optional<String>> START_PING = new MongoStartupPing()::check;

	/** Port 1 is closed on each test host, so the menu has no local server. */
	private final MongoDetector noLocalServer = new MongoDetector("localhost", 1);

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	private final SetupContext context = new SetupContext();

	@Test
	void runOffersLocalServerFirstWhenPortListens() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			int port = server.getLocalPort();
			console.type("");

			step(new MongoDetector("localhost", port), ANSWERS).run(context, prompter);

			assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?",
					"1) Local server", "localhost:" + port, "2) Server URI", "3) Exit", "  Choice [1]: ");
			assertThat(context.mongoUri()).contains("mongodb://localhost:" + port + "/opencelium");
			// The step starts no MongoDB: nothing runs after the summary for it.
			assertThat(context.filePlan().actions()).isEmpty();
			assertThat(context.filePlan().files()).isEmpty();
		}
	}

	@Test
	void runOffersUriAndExitWhenNoServerListens() {
		console.type("2");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(noLocalServer, ANSWERS).run(context, prompter));

		assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?", "1) Server URI",
				"2) Exit", "  Choice [1]: ").doesNotContain("3)").doesNotContainIgnoringCase("docker");
		assertThat(context.filePlan().actions()).isEmpty();
		assertThat(context.mongoUri()).isEmpty();
	}

	@Test
	void runShowsAnExampleWithAuthSourceWhenTheUserTypesAQuestionMark() {
		// The input ends after the help text, which cancels the setup.
		console.type("", "?");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(noLocalServer, ANSWERS).run(context, prompter));

		// An example with a database username, a database password and the database that holds the database user.
		assertThat(console.output()).containsSubsequence("  MongoDB URI     [", "?authSource=admin")
				.containsPattern("mongodb://\\w+:[^@\\n]+@[^/\\n]+/opencelium\\?authSource=admin");
	}

	@Test
	void runPingsBeforeItContinuesWhenUriIsTyped() {
		console.type("", LocalMongo.uriFor(MongoStepTest.class));

		step(noLocalServer, START_PING).run(context, prompter);

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
				.isThrownBy(() -> step(noLocalServer, START_PING).run(context, prompter));

		assertThat(console.output()).contains("  ! Cannot use MongoDB at mongodb://oc_nobody:****@")
				.contains(": authentication failed for user 'oc_nobody'.")
				.containsSubsequence("1) Type the URI again", "2) Continue", "3) Back to the menu")
				.doesNotContain("wrong-password");
		assertThat(context.mongoUri()).isEmpty();
	}

	@Test
	void runOffersRetryMenuWhenPortIsClosed() {
		console.type("", "mongodb://oc:secret@localhost:1/opencelium", "2");

		step(noLocalServer, START_PING).run(context, prompter);

		assertThat(console.output())
				.contains("  ! Cannot use MongoDB at mongodb://oc:****@localhost:1/opencelium: connection refused.")
				.containsSubsequence("  What now?", "1) Type the URI again", "2) Continue", "3) Back to the menu",
						"  Choice [1]: ", "OpenCelium does not start until MongoDB at mongodb://oc:****@localhost:1"
								+ "/opencelium answers.");
		assertThat(context.mongoUri()).contains("mongodb://oc:secret@localhost:1/opencelium");
		assertThat(context.environment()).isEmpty();
	}

	@Test
	void runAsksTheUriAgainWhenRetryIsChosen() {
		console.type("", "mongodb://bad.example/opencelium", "1", "mongodb://db.example/opencelium");

		step(noLocalServer, refusedBy("bad.example")).run(context, prompter);

		assertThat(console.output()).containsSubsequence("connection refused", "  What now?", "  MongoDB URI     [",
				"  OK MongoDB answers at mongodb://db.example/opencelium");
		assertThat(context.mongoUri()).contains("mongodb://db.example/opencelium");
	}

	@Test
	void runShowsTheMenuAgainWhenBackIsChosen() {
		console.type("", "mongodb://bad.example/opencelium", "3", "2");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(noLocalServer, refusedBy("bad.example")).run(context, prompter));

		assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?", "  What now?",
				"  Which MongoDB does OpenCelium use?");
		assertThat(context.mongoUri()).isEmpty();
	}

	@Test
	void runAsksAgainWhenTheDnsLookupOfAnSrvAddressFails() {
		console.type("", "mongodb+srv://oc:s3cret@" + FailingDnsClientProvider.FAILING_HOST + "/opencelium",
				"mongodb://db.example/opencelium");

		step(noLocalServer, ANSWERS).run(context, prompter);

		assertThat(console.output()).containsSubsequence("  ! '", FailingDnsClientProvider.FAILING_HOST,
				"  MongoDB URI     [", "  OK MongoDB answers at mongodb://db.example/opencelium")
				.doesNotContain("s3cret");
		assertThat(context.mongoUri()).contains("mongodb://db.example/opencelium");
	}

	@Test
	void runKeepsTheWholeUriAndAsksNothingWhenTheTypedUriHasADatabasePassword() {
		// The input ends after the URI: one more question would cancel the setup.
		console.type("", "mongodb://oc:s3cr%40t@db.example/opencelium?authSource=admin");

		step(noLocalServer, ANSWERS).run(context, prompter);

		// The percent-encoding stays as typed.
		assertThat(context.mongoUri()).contains("mongodb://oc:s3cr%40t@db.example/opencelium?authSource=admin");
		// The summary puts the URI into the env file; the step adds no entry of its own.
		assertThat(context.environment()).isEmpty();
		assertThat(console.output()).doesNotContain("Move the password").doesNotContain("application.yml")
				.doesNotContain("s3cr");
	}

	@Test
	void runKeepsTheWholeUriWhenTheFileGivesItInBatchMode() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "uri",
				ValueKey.MONGO_URI, "mongodb://oc:s3cret@db.example/opencelium"));

		step(noLocalServer, ANSWERS).run(batch, prompter);

		assertThat(batch.mongoUri()).contains("mongodb://oc:s3cret@db.example/opencelium");
		assertThat(batch.environment()).isEmpty();
		assertThat(console.output()).contains("  MongoDB         uri   (from setup-values.yml)")
				.contains("  MongoDB URI     mongodb://oc:****@db.example/opencelium   (from setup-values.yml)")
				.doesNotContain("[Y/n]").doesNotContain("Choice [").doesNotContain("s3cret");
		assertThat(batch.filePlan().actions()).isEmpty();
		assertThat(batch.filePlan().files()).isEmpty();
	}

	@Test
	void runStopsNamingTheKeyWhenTheServerOfTheFileDoesNotAnswer() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "uri",
				ValueKey.MONGO_URI, "mongodb://oc:s3cret@bad.example/opencelium"));

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(noLocalServer, refusedBy("bad.example")).run(batch, prompter))
				.withMessage("Bad value: mongo-uri in setup-values.yml: Cannot use MongoDB at"
						+ " mongodb://oc:****@bad.example/opencelium: connection refused.");
		assertThat(batch.mongoUri()).isEmpty();
	}

	@Test
	void runStopsNamingTheKeyWhenTheFileNamesAnUnknownServer() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "postgres"));

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(noLocalServer, ANSWERS).run(batch, prompter))
				.withMessage("Bad value: mongo in setup-values.yml: 'postgres' is not one of: local, uri.");
	}

	@Test
	void runMasksTheDatabasePasswordWhenTheFileGivesAUriAsTheServer() {
		// The URI under the wrong setup file key.
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "mongodb://oc:s3cret@db.example/opencelium"));

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(noLocalServer, ANSWERS).run(batch, prompter))
				.withMessage("Bad value: mongo in setup-values.yml: 'mongodb://oc:****@db.example/opencelium' is not"
						+ " one of: local, uri.");
		assertThat(console.output()).doesNotContain("s3cret");
	}

	@Test
	void runStopsNamingTheKeyWhenTheFileSaysDocker() {
		SetupContext batch = batch(Map.of(ValueKey.MONGO, "docker"));

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(noLocalServer, ANSWERS).run(batch, prompter))
				.withMessage("Bad value: mongo in setup-values.yml: 'docker' is not one of: local, uri.");
		assertThat(batch.filePlan().actions()).isEmpty();
		assertThat(batch.mongoUri()).isEmpty();
	}

	@Test
	void questionsGiveTheTemplateTheServerAndTheUriWithTheDefaultsOfThisHost() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			int port = server.getLocalPort();

			assertThat(step(new MongoDetector("localhost", port), ANSWERS).questions())
					.extracting(question -> question.key().word(), question -> question.defaultValue())
					.containsExactly(tuple("mongo", "local"),
							tuple("mongo-uri", "mongodb://localhost:" + port
									+ "/opencelium"));
		}
		assertThat(step(noLocalServer, ANSWERS).questions().getFirst().defaultValue()).isEqualTo("uri");
		assertThat(step(noLocalServer, ANSWERS).questions().getFirst().help()).contains("local", "uri")
				.doesNotContainIgnoringCase("docker");
	}

	private MongoStep step(MongoDetector detector, Function<MongoConnection, Optional<String>> ping) {
		return new MongoStep(detector, ping);
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
