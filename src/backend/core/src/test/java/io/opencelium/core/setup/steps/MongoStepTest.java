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
 * of a server that exists, or the values of that URI one by one. The step starts no MongoDB. Each typed answer is
 * pinged before the step continues, with the causes of the start ping, and a failed ping offers to type the answer
 * again, to continue, or to go back to the menu. The values are the host, the port, the database and, with a
 * database username, the database password and the authentication database; the terminal does not show the database
 * password, and each text is one, also {@code q} and {@code ?}. A host, a port or a database name in another form
 * is named and asked again at its question. The step keeps the whole URI, also with a database
 * password, and asks nothing about it. The tests that ping use the local MongoDB without a Spring context, because
 * the step runs before Spring starts; the others use a server that always answers.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class MongoStepTest {

	private static final Path FILE = Path.of("setup-values.yml");

	private static final Function<MongoConnection, Optional<String>> ANSWERS = connection -> Optional.empty();

	private static final Function<MongoConnection, Optional<String>> START_PING = new MongoStartupPing()::check;

	private static final String HOST_PROMPT = "  MongoDB host    [localhost]: ";

	private static final String PORT_PROMPT = "  MongoDB port    [27017]: ";

	private static final String DATABASE_PROMPT = "  Database        [opencelium]: ";

	/** No default: Enter means that the server needs no database login. */
	private static final String USERNAME_PROMPT = "  Database username []: ";

	private static final String PASSWORD_PROMPT = "  Database password (hidden): ";

	private static final String AUTH_DATABASE_PROMPT = "  Authentication database [admin]: ";

	/** Port 1 is closed on each test host, so the menu has no local server. */
	private final MongoDetector noLocalServer = new MongoDetector("localhost", 1);

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	private final SetupContext context = new SetupContext();

	@Test
	void runOffersTheLocalServerFirstWhenAServerListens() throws IOException {
		try (ServerSocket server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
			int port = server.getLocalPort();
			console.type("");

			step(new MongoDetector("localhost", port), ANSWERS).run(context, prompter);

			// The local server is the first option and the default; the options without a local server follow.
			assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?",
					"1) Local server", "localhost:" + port, "2) Server URI", "3) Server values", "4) Exit",
					"  Choice [1]: ", "  -> Pinging MongoDB at mongodb://localhost:" + port + "/opencelium...",
					"  OK MongoDB answers at mongodb://localhost:" + port + "/opencelium");
			assertThat(context.mongoUri()).contains("mongodb://localhost:" + port + "/opencelium");
			// The step starts no MongoDB: nothing runs after the summary for it.
			assertThat(context.filePlan().actions()).isEmpty();
			assertThat(context.filePlan().files()).isEmpty();
		}
	}

	@Test
	void runOffersUriValuesAndExitWhenNoServerListens() {
		console.type("3");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(noLocalServer, ANSWERS).run(context, prompter));

		assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?", "1) Server URI",
				"2) Server values", "3) Exit", "  Choice [1]: ").doesNotContain("4)").doesNotContain("Local server")
				.doesNotContainIgnoringCase("docker");
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

		assertThat(console.output()).containsSubsequence("1) Server URI", "2) Server values", "3) Exit",
				"  Choice [1]: ", "  MongoDB URI     [", "  -> Pinging MongoDB at mongodb://",
				"  OK MongoDB answers at mongodb://");
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
		console.type("", "mongodb://bad.example/opencelium", "3", "3");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(noLocalServer, refusedBy("bad.example")).run(context, prompter));

		// Option 3 of the menu is the exit: no "out of range" message and no question of the values option.
		assertThat(console.output()).containsSubsequence("  Which MongoDB does OpenCelium use?", "  What now?",
				"  Which MongoDB does OpenCelium use?").doesNotContain("Please enter a number")
				.doesNotContain(HOST_PROMPT);
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
	void runAsksTheSixValuesWhenTheValuesOptionIsChosen() {
		console.type("2", "db.example", "27018", "ocdb", "oc", "s3cret", "users");

		step(noLocalServer, ANSWERS).run(context, prompter);

		assertThat(console.output()).containsSubsequence("2) Server values", HOST_PROMPT, PORT_PROMPT, DATABASE_PROMPT,
				USERNAME_PROMPT, PASSWORD_PROMPT, AUTH_DATABASE_PROMPT,
				"  -> Pinging MongoDB at mongodb://oc:****@db.example:27018/ocdb?authSource=users...",
				"  OK MongoDB answers at mongodb://oc:****@db.example:27018/ocdb?authSource=users")
				.doesNotContain("s3cret");
		assertThat(context.mongoUri()).contains("mongodb://oc:s3cret@db.example:27018/ocdb?authSource=users");
		// The terminal shows each answer except the database password.
		assertThat(console.linesWithoutEcho()).containsExactly("s3cret");
		// The summary puts the URI into the env file; the step adds no entry of its own.
		assertThat(context.environment()).isEmpty();
	}

	@Test
	void runSkipsThePasswordAndTheAuthSourceWhenTheDatabaseUsernameIsEmpty() {
		// The input ends after the database username: one more question would cancel the setup.
		console.type("2", "", "", "", "");

		step(noLocalServer, ANSWERS).run(context, prompter);

		// The defaults of the host, the port and the database, without a database login and without authSource.
		assertThat(context.mongoUri()).contains("mongodb://localhost:27017/opencelium");
		assertThat(console.output()).contains(USERNAME_PROMPT).doesNotContain("Database password")
				.doesNotContain("Authentication database");
		assertThat(console.linesWithoutEcho()).isEmpty();
	}

	@Test
	void runAsksAgainWhenTheDatabasePasswordIsEmpty() {
		console.type("2", "", "", "", "oc", "", "s3cret", "");

		step(noLocalServer, ANSWERS).run(context, prompter);

		assertThat(console.output()).containsSubsequence(PASSWORD_PROMPT, "  ! Database password cannot be empty.",
				PASSWORD_PROMPT, AUTH_DATABASE_PROMPT);
		// The default of the authentication database is admin.
		assertThat(context.mongoUri()).contains("mongodb://oc:s3cret@localhost:27017/opencelium?authSource=admin");
	}

	@Test
	void runTakesQAndQuestionMarkAsTheDatabasePassword() {
		// No cancel and no help text: each of the 2 is a database password.
		assertThat(uriOfTheValuesWithDatabasePassword("q"))
				.isEqualTo("mongodb://oc:q@localhost:27017/opencelium?authSource=admin");
		assertThat(uriOfTheValuesWithDatabasePassword("?"))
				.isEqualTo("mongodb://oc:%3F@localhost:27017/opencelium?authSource=admin");
	}

	@Test
	void runShowsTheHelpOfAValueWhenTheUserTypesAQuestionMark() {
		// The input ends after the help text, which cancels the setup.
		console.type("2", "?");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> step(noLocalServer, ANSWERS).run(context, prompter));

		assertThat(console.output()).containsSubsequence(HOST_PROMPT,
				"    The host name or the IP address of the MongoDB server", HOST_PROMPT);
	}

	@Test
	void runAsksTheHostAgainWhenTheAnswerIsNoHostNameOrIpAddress() {
		console.type("2", "db.example:27018", "db example", "mongodb://oc:s3cret@db.example", "::1", "[::1]", "", "",
				"");

		step(noLocalServer, ANSWERS).run(context, prompter);

		String problem = "' is not a host name or an IP address.";
		assertThat(console.output()).containsSubsequence(HOST_PROMPT, "  ! 'db.example:27018" + problem, HOST_PROMPT,
				"  ! 'db example" + problem, HOST_PROMPT,
				// A URI at the host question holds a database password, so the message masks it.
				"  ! 'mongodb://oc:****@db.example" + problem, HOST_PROMPT,
				// An IPv6 address without square brackets has the colons of a port.
				"  ! '::1" + problem, HOST_PROMPT, PORT_PROMPT)
				.doesNotContain("s3cret");
		assertThat(context.mongoUri()).contains("mongodb://[::1]:27017/opencelium");
	}

	@Test
	void runAsksThePortAgainWhenTheAnswerIsNoNumberFrom1To65535() {
		console.type("2", "", "abc", "0", "65536", "27018", "", "");

		step(noLocalServer, ANSWERS).run(context, prompter);

		String problem = "  ! Please enter a port number between 1 and 65535.";
		assertThat(console.output()).containsSubsequence(PORT_PROMPT, problem, PORT_PROMPT, problem, PORT_PROMPT,
				problem, PORT_PROMPT, DATABASE_PROMPT);
		assertThat(context.mongoUri()).contains("mongodb://localhost:27018/opencelium");
	}

	@Test
	void runAsksADatabaseNameAgainWhenTheAnswerHasAnotherCharacter() {
		console.type("2", "", "", "my db", "oc.db", "oc-db_1", "oc", "s3cret", "$external", "users");

		step(noLocalServer, ANSWERS).run(context, prompter);

		String problem = "' is not a database name here: use A-Z, a-z, 0-9, - and _ only.";
		assertThat(console.output()).containsSubsequence(DATABASE_PROMPT, "  ! 'my db" + problem, DATABASE_PROMPT,
				"  ! 'oc.db" + problem, DATABASE_PROMPT, USERNAME_PROMPT,
				// The authentication database has the same form.
				AUTH_DATABASE_PROMPT, "  ! '$external" + problem, AUTH_DATABASE_PROMPT);
		assertThat(context.mongoUri()).contains("mongodb://oc:s3cret@localhost:27017/oc-db_1?authSource=users");
	}

	@Test
	void runOffersTypeTheValuesAgainWithTheLastAnswersWhenThePingFails() {
		console.type("2", "bad.example", "27018", "ocdb", "oc", "s3cret", "users",
				"1", "db.example", "", "", "", "n3w", "");

		step(noLocalServer, refusedBy("bad.example")).run(context, prompter);

		assertThat(console.output()).containsSubsequence(HOST_PROMPT, AUTH_DATABASE_PROMPT,
				"  ! Cannot use MongoDB at mongodb://oc:****@bad.example:27018/ocdb?authSource=users: connection"
						+ " refused.",
				"  What now?", "1) Type the values again", "2) Continue", "3) Back to the menu", "  Choice [1]: ",
				// The last answers are the defaults. The database password has none: the user types it again.
				"  MongoDB host    [bad.example]: ", "  MongoDB port    [27018]: ", "  Database        [ocdb]: ",
				"  Database username [oc]: ", PASSWORD_PROMPT, "  Authentication database [users]: ",
				"  OK MongoDB answers at mongodb://oc:****@db.example:27018/ocdb?authSource=users")
				.doesNotContain("Type the URI again").doesNotContain("s3cret").doesNotContain("n3w");
		assertThat(context.mongoUri()).contains("mongodb://oc:n3w@db.example:27018/ocdb?authSource=users");
		assertThat(console.linesWithoutEcho()).containsExactly("s3cret", "n3w");
	}

	@Test
	void runAsksTheValuesWithTheirDefaultsAgainWhenTheUserComesBackFromTheMenu() {
		console.type("2", "bad.example", "27018", "ocdb", "oc", "s3cret", "users", "3", "2", "", "", "", "");

		step(noLocalServer, refusedBy("bad.example")).run(context, prompter);

		// Only "Type the values again" keeps the last answers. From the menu, each value has its default again, so
		// Enter at the database username gives a URI without a database login.
		assertThat(console.output()).containsSubsequence("3) Back to the menu", "  Which MongoDB does OpenCelium use?",
				HOST_PROMPT, PORT_PROMPT, DATABASE_PROMPT, USERNAME_PROMPT,
				"  OK MongoDB answers at mongodb://localhost:27017/opencelium");
		assertThat(context.mongoUri()).contains("mongodb://localhost:27017/opencelium");
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

	/**
	 * The URI of a run of the values option with the defaults, the database username {@code oc} and
	 * {@code databasePassword}. The input ends after the authentication database, so a second database password
	 * question would cancel the run.
	 */
	private String uriOfTheValuesWithDatabasePassword(String databasePassword) {
		ScriptedConsoleIo typed = new ScriptedConsoleIo().type("2", "", "", "", "oc", databasePassword, "");
		SetupContext run = new SetupContext();

		step(noLocalServer, ANSWERS).run(run, new ConsolePrompter(typed));

		assertThat(typed.output()).containsOnlyOnce(PASSWORD_PROMPT);
		assertThat(typed.linesWithoutEcho()).containsExactly(databasePassword);
		return run.mongoUri().orElseThrow();
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
