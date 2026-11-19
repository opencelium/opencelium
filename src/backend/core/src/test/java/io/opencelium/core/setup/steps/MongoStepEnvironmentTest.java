package io.opencelium.core.setup.steps;

import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;

import com.mongodb.ConnectionString;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.setup.ConfigLocations;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.mongo.MongoDetector;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.values.EnvironmentSnapshot;
import io.opencelium.core.setup.values.SetupValues;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeFalse;

/**
 * The MongoDB step with a MongoDB connection from the environment of the setup. A {@code SPRING_MONGODB_} variable
 * goes to the connection resolution of the start, else {@code OC_MONGO_URI} goes to the URI rules of the start. The
 * step asks nothing, shows the connection without its database password and with the variable that gives it, and
 * pings the server. A server that does not answer, and a value that the start does not accept, stop the setup
 * without the retry menu, because each start reads the variable again. A setup file must give the same connection,
 * and in batch mode a variable alone gives the connection.
 * The tests that ping use the local MongoDB without a Spring context, because the step runs before Spring starts; the
 * others use a ping that always answers. No input is scripted: a question would end the input and cancel the setup.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class MongoStepEnvironmentTest {

	private static final Path FILE = Path.of("setup-values.yml");

	private static final Function<MongoConnection, Optional<String>> ANSWERS = connection -> Optional.empty();

	private static final Function<MongoConnection, Optional<String>> START_PING = new MongoStartupPing()::check;

	private static final String MENU_QUESTION = "How do you want to connect OpenCelium to MongoDB?";

	private static final String DATABASE = LocalMongo.databaseFor(MongoStepEnvironmentTest.class);

	/** Port 1 is closed on each test host, so the menu would have no local server. */
	private final MongoDetector noLocalServer = new MongoDetector("localhost", 1);

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	@TempDir
	Path tmp;

	@Test
	void runTakesTheUriWithoutMenuWhenSpringMongodbUriIsSet() {
		SetupContext context = withVariables(Map.of("SPRING_MONGODB_URI", LocalMongo.uri(DATABASE)));

		step(START_PING).run(context, prompter);

		assertThat(console.output()).doesNotContain(MENU_QUESTION).containsSubsequence(
				"(from the environment: SPRING_MONGODB_URI)", "OK MongoDB answers at mongodb://");
		assertThat(context.mongoConnection().databaseName()).isEqualTo(DATABASE);
		// The env file gets no copy: the environment stays the only source of the connection.
		assertThat(context.mongoUri()).isEmpty();
	}

	@Test
	void runResolvesHostVariablesLikeTheStartWhenNoUriIsSet() {
		ConnectionString server = new ConnectionString(LocalMongo.uri(DATABASE));
		assumeFalse(server.isSrvProtocol(), "host-style variables cannot describe a mongodb+srv server");
		String address = server.getHosts().getFirst();
		int colon = address.lastIndexOf(':');
		boolean withPort = colon > address.lastIndexOf(']');
		Map<String, String> variables = new HashMap<>();
		variables.put("SPRING_MONGODB_HOST", withPort ? address.substring(0, colon) : address);
		variables.put("SPRING_MONGODB_PORT", withPort ? address.substring(colon + 1) : "27017");
		variables.put("SPRING_MONGODB_DATABASE", DATABASE);
		if (server.getCredential() != null) {
			variables.put("SPRING_MONGODB_USERNAME", server.getCredential().getUserName());
			variables.put("SPRING_MONGODB_PASSWORD", new String(server.getCredential().getPassword()));
			variables.put("SPRING_MONGODB_AUTHENTICATION_DATABASE", server.getCredential().getSource());
		}
		SetupContext context = withVariables(variables);

		step(START_PING).run(context, prompter);

		// The start builds the connection from the host-style properties; no URI text exists for the env file.
		MongoConnection connection = context.mongoConnection();
		assertThat(connection.connectionString().getHosts()).containsExactly(withPort ? address : address + ":27017");
		assertThat(connection.databaseName()).isEqualTo(DATABASE);
		assertThat(context.mongoUri()).isEmpty();
		assertThat(console.output()).doesNotContain(MENU_QUESTION).containsSubsequence("SPRING_MONGODB_HOST",
				"OK MongoDB answers at mongodb://");
	}

	@Test
	void runUsesTheDefaultUriWithTheDatabaseWhenOnlyTheDatabaseVariableIsSet() {
		SetupContext context = withVariables(Map.of("SPRING_MONGODB_DATABASE", "oc_from_variable"));

		step(ANSWERS).run(context, prompter);

		// As at the start: the documented default server, with the database of the variable.
		MongoConnection connection = context.mongoConnection();
		assertThat(connection.connectionString().getHosts()).containsExactly("localhost:27017");
		assertThat(connection.databaseName()).isEqualTo("oc_from_variable");
		assertThat(console.output()).doesNotContain(MENU_QUESTION)
				.contains("(from the environment: SPRING_MONGODB_DATABASE)");
	}

	@Test
	void runShowsNoLogPatternDefaultWhenItAppliesTheDefaults() {
		// A SPRING_MONGODB_ variable sends the step through the defaults of the start, which include the log pattern.
		SetupContext context = withVariables(Map.of("SPRING_MONGODB_DATABASE", "oc_from_variable"));

		step(ANSWERS).run(context, prompter);

		assertThat(console.output()).contains("(from the environment: SPRING_MONGODB_DATABASE)")
				.doesNotContain("logging.pattern").doesNotContain("%X{");
	}

	@Test
	void runPrefersTheSpringMongodbVariableWhenOcMongoUriIsAlsoSet() {
		SetupContext context = withVariables(Map.of("SPRING_MONGODB_URI", "mongodb://oc:s3cret@db.example/oc_spring",
				"OC_MONGO_URI", "mongodb://other.example/oc_placeholder"));

		step(ANSWERS).run(context, prompter);

		// The yml file then has no MongoDB line, so OC_MONGO_URI has no effect at a start either.
		assertThat(context.mongoConnection().databaseName()).isEqualTo("oc_spring");
		assertThat(console.output()).contains("mongodb://oc:****@db.example/oc_spring",
				"(from the environment: SPRING_MONGODB_URI)").doesNotContain("s3cret").doesNotContain("other.example");
	}

	@Test
	void runTakesOcMongoUriWithoutMenuWhenNoSpringMongodbVariableIsSet() {
		SetupContext context = withVariables(Map.of("OC_MONGO_URI", "mongodb://db.example/oc_placeholder"));

		step(ANSWERS).run(context, prompter);

		assertThat(context.mongoConnection().databaseName()).isEqualTo("oc_placeholder");
		assertThat(context.mongoUri()).isEmpty();
		assertThat(console.output()).doesNotContain(MENU_QUESTION).contains("(from the environment: OC_MONGO_URI)");
	}

	@Test
	void runTakesTheVariableInBatchModeWhenTheSetupFileHasNoMongoKey() {
		SetupContext context = batch(Map.of(), Map.of("SPRING_MONGODB_URI", "mongodb://db.example/oc_batch"));

		step(ANSWERS).run(context, prompter);

		// The variable gives the value, so the absent key of the setup file is no missing value.
		assertThat(context.mongoConnection().databaseName()).isEqualTo("oc_batch");
		assertThat(console.output()).contains("(from the environment: SPRING_MONGODB_URI)")
				.doesNotContain("Missing value");
	}

	@Test
	void runShowsNoDatabasePasswordWhenHostVariablesGiveTheLogin() {
		SetupContext context = withVariables(Map.of("SPRING_MONGODB_HOST", "db.example", "SPRING_MONGODB_USERNAME",
				"oc", "SPRING_MONGODB_PASSWORD", "s3cret", "SPRING_MONGODB_DATABASE", "oc_hosts"));
		context.setDataDir(tmp.resolve("data"));
		context.setPort(9090);
		console.type("y");

		step(ANSWERS).run(context, prompter);
		new SummaryStep(new ConfigLocations(tmp, tmp.resolve("etc/opencelium"))).run(context, prompter);

		// The step line, the ping lines and the summary show the database username, never the database password.
		assertThat(console.output()).contains("oc:****@db.example").doesNotContain("s3cret");
		assertThat(context.filePlan().files()).allSatisfy(file -> assertThat(file.content()).doesNotContain("s3cret"));
	}

	@Test
	void runStopsAndNamesTheVariableWhenTheServerDoesNotAnswer() {
		SetupContext context = withVariables(Map.of("SPRING_MONGODB_URI",
				"mongodb://oc:s3cret@localhost:1/opencelium"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(START_PING).run(context, prompter)).actual();

		// No retry menu: each start reads the variable, so another answer of the setup would not apply.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).contains("SPRING_MONGODB_URI", "connection refused",
				"mongodb://oc:****@localhost:1/opencelium").doesNotContain("s3cret");
		assertThat(console.output()).doesNotContain("What now?").doesNotContain("s3cret");
	}

	@Test
	void runStopsAndNamesTheVariableWhenTheStartRejectsTheUri() {
		// An @ in the database password without percent-encoding: the start does not accept the URI.
		SetupContext context = withVariables(Map.of("OC_MONGO_URI", "mongodb://oc:p@ss@db.example/opencelium"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(ANSWERS).run(context, prompter)).actual();

		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines().getFirst()).startsWith("Bad value: OC_MONGO_URI in the environment: ");
		assertThat(ex.getMessage()).contains("remove the variable").doesNotContain("p@ss");
		assertThat(console.output()).doesNotContain(MENU_QUESTION);
	}

	@Test
	void runStopsAndNamesTheVariableWhenTheStartRejectsTheSpringMongodbValues() {
		// The start does not accept a URI together with a host-style property: it would ignore the host.
		SetupContext context = withVariables(Map.of("SPRING_MONGODB_URI", "mongodb://db.example/opencelium",
				"SPRING_MONGODB_HOST", "other.example"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(ANSWERS).run(context, prompter)).actual();

		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines().getFirst()).startsWith("Bad value: SPRING_MONGODB_HOST in the environment: ");
		assertThat(ex.getMessage()).contains("remove the variable");
		assertThat(console.output()).doesNotContain(MENU_QUESTION);
	}

	@Test
	void runAcceptsTheSetupFileUriWhenItGivesTheSameConnection() {
		// 1 connection in 2 forms: host-style variables, and a URI with the default port.
		SetupContext context = batch(Map.of(ValueKey.MONGO, "uri", ValueKey.MONGO_URI,
				"mongodb://db.example:27017/oc_same"), Map.of("SPRING_MONGODB_HOST", "db.example",
						"SPRING_MONGODB_DATABASE", "oc_same"));

		step(ANSWERS).run(context, prompter);

		assertThat(context.mongoConnection().databaseName()).isEqualTo("oc_same");
		assertThat(context.mongoUri()).isEmpty();
		assertThat(console.output()).contains("(from the environment: SPRING_MONGODB_DATABASE, SPRING_MONGODB_HOST)");
	}

	@Test
	void runStopsWhenTheSetupFileUriGivesAnotherConnection() {
		SetupContext context = batch(Map.of(ValueKey.MONGO, "uri", ValueKey.MONGO_URI,
				"mongodb://oc:s3cret@db.example/oc_file"), Map.of("SPRING_MONGODB_URI",
						"mongodb://oc:s3cret@db.example/oc_variable"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(ANSWERS).run(context, prompter)).actual();

		// The key, the file and the variable, but no value.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines()).containsExactly("Different values: mongo-uri in setup-values.yml and the variable"
				+ " SPRING_MONGODB_URI.", "Remove one of them, or give both the same value.");
		assertThat(console.output()).doesNotContain("s3cret");
	}

	@Test
	void runStopsWhenTheSetupFileSaysLocalAndTheVariableGivesAnotherServer() {
		SetupContext context = batch(Map.of(ValueKey.MONGO, "local"), Map.of("SPRING_MONGODB_URI",
				"mongodb://db.example/opencelium"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step(ANSWERS).run(context, prompter)).actual();

		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines()).containsExactly("Different values: mongo in setup-values.yml and the variable"
				+ " SPRING_MONGODB_URI.", "Remove one of them, or give both the same value.");
	}

	private MongoStep step(Function<MongoConnection, Optional<String>> ping) {
		return new MongoStep(noLocalServer, ping);
	}

	/** A terminal, no setup file, and these environment variables. */
	private static SetupContext withVariables(Map<String, String> variables) {
		return new SetupContext(new ValueSource(SetupValues.NONE, Optional.empty(), false,
				new EnvironmentSnapshot(variables)));
	}

	/** Batch mode with a setup file of these values, and these environment variables. */
	private static SetupContext batch(Map<ValueKey, String> values, Map<String, String> variables) {
		return new SetupContext(new ValueSource(new SetupValues(values), Optional.of(FILE), true,
				new EnvironmentSnapshot(variables)));
	}

}
