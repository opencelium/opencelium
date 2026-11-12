package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.OptionalInt;
import java.util.concurrent.TimeUnit;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoTimeoutException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.setup.AdminMarker;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.Wizard;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.values.SetupFile;
import io.opencelium.core.setup.values.SetupValues;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.fake.NamedStep;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The admin step asks the admin username with the default {@code admin} and plans the admin marker; the start makes
 * the admin from it. The step asks no admin password. When the database of the MongoDB step holds an admin, the step
 * does not apply. The question "an admin exists" is a fake in most tests; 1 test connects the step to its query
 * against the local MongoDB, without a Spring context, as the wizard runs before Spring starts.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class AdminStepTest {

	private static final String URI = "mongodb://localhost:27017/opencelium";

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	private final SetupContext context = new SetupContext();

	private final List<MongoConnection> asked = new ArrayList<>();

	@TempDir
	Path tmp;

	@Test
	void runStoresDefaultUsernameWhenInputIsEmpty() {
		context.setMongoUri(URI);
		console.type("");

		new AdminStep(connection -> false).run(context, prompter);

		assertThat(context.adminUsername()).contains("admin");
		assertThat(context.filePlan().actions()).singleElement().isInstanceOf(AdminMarker.class)
				.extracting(PlannedAction::description).asString().contains("admin marker", "'admin'");
		assertThat(console.output()).contains("  Admin username  [admin]: ");
		// The admin password is fixed: no question for it.
		assertThat(console.promptsWithoutEcho()).isEmpty();
	}

	@Test
	void runAsksAgainWhenTheUsernameHasASpace() {
		context.setMongoUri(URI);
		console.type("my admin", "root");

		new AdminStep(connection -> false).run(context, prompter);

		assertThat(context.adminUsername()).contains("root");
		assertThat(console.output()).contains("space");
	}

	@Test
	void runAsksAgainWhenTheUsernameHasAControlCharacter() {
		context.setMongoUri(URI);
		// An escape sequence would steer the terminal where the username shows: the summary, the box, the log.
		console.type("ad\u001b[2Jmin", "root");

		new AdminStep(connection -> false).run(context, prompter);

		assertThat(context.adminUsername()).contains("root");
		assertThat(console.output()).contains("control characters");
	}

	@Test
	void runSkipsWhenAdminExists() {
		var mongo = new NamedStep("MongoDB", (setup, prompts) -> setup.setMongoUri(URI));
		var admin = new AdminStep(connection -> {
			asked.add(connection);
			return true;
		});

		OptionalInt exitCode = new Wizard(prompter, ValueSource.PROMPTED, List.of(mongo, admin), environment -> {
		}, Optional.empty()).run("requested with setup");

		// Nothing planned: no file, no marker, no start.
		assertThat(exitCode).hasValue(0);
		assertThat(console.output()).contains("Step 2 of 2: Admin account (skipped)").doesNotContain("Admin username");
		assertThat(asked).singleElement().extracting(MongoConnection::databaseName).isEqualTo("opencelium");
	}

	@Test
	void applicableStopsNamingTheServerWithoutTheDatabasePasswordWhenMongoDbDoesNotAnswer() {
		context.setMongoUri("mongodb://oc:s3cret@localhost:1/opencelium");
		var admin = new AdminStep(connection -> {
			throw new MongoTimeoutException("Timed out: mongodb://oc:s3cret@localhost:1");
		});

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> admin.applicable(context)).actual();

		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).contains("mongodb://oc:****@localhost:1/opencelium").doesNotContain("s3cret");
	}

	@Test
	void runTakesTheUsernameFromTheSetupFile() throws IOException {
		Path file = Files.writeString(tmp.resolve("setup-values.yml"), "admin-username: root\n");
		var fromFile = new SetupContext(new ValueSource(SetupFile.load(file), Optional.of(file), true));
		fromFile.setMongoUri(URI);

		new AdminStep(connection -> false).run(fromFile, prompter);

		assertThat(fromFile.adminUsername()).contains("root");
		assertThat(console.output()).contains("from " + file).doesNotContain("[admin]: ");
	}

	@Test
	void runStopsNamingTheKeyWhenBatchAndTheUsernameIsAbsent() {
		Path file = Path.of("setup-values.yml");
		var batch = new SetupContext(new ValueSource(SetupValues.NONE, Optional.of(file), true));
		batch.setMongoUri(URI);

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> new AdminStep(connection -> false).run(batch, prompter)).actual();

		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).startsWith("Missing value: admin-username in " + file);
		assertThat(batch.filePlan().isEmpty()).isTrue();
	}

	@Test
	void questionsGiveTheTemplateTheUsernameAndItsDefault() {
		assertThat(new AdminStep(connection -> false).questions()).singleElement().satisfies(question -> {
			assertThat(question.key().word()).isEqualTo("admin-username");
			assertThat(question.defaultValue()).isEqualTo("admin");
			assertThat(question.help()).contains("1234");
		});
	}

	@Test
	void applicableIsFalseOnlyWhenTheDatabaseOfTheMongoDbStepHoldsAnAdminOfTheSelfHostTenant() {
		String uri = LocalMongo.uriFor(AdminStepTest.class);
		context.setMongoUri(uri);
		try (MongoClient client = client(uri)) {
			var users = client.getDatabase(LocalMongo.databaseFor(AdminStepTest.class)).getCollection("users");
			users.drop();
			users.insertOne(admin("other"));
			assertThat(new AdminStep().applicable(context)).isTrue();

			users.insertOne(admin("self-host"));
			assertThat(new AdminStep().applicable(context)).isFalse();
		}
	}

	/** An admin as the user service stores it. */
	private static Document admin(String tenant) {
		return new Document("tenantId", tenant).append("username", "admin").append("roles", List.of("ADMIN"));
	}

	/** Gives up after 5 s when the server is gone, as the setup ping does. */
	private static MongoClient client(String uri) {
		return MongoClients.create(MongoClientSettings.builder().applyConnectionString(new ConnectionString(uri))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build());
	}

}
