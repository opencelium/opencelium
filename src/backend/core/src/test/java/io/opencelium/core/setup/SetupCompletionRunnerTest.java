package io.opencelium.core.setup;

import java.nio.file.Path;
import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.user.CreateAdminCommand;
import io.opencelium.core.user.UserCreated;
import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserRepository;
import io.opencelium.core.user.UserService;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The second half of the setup, after Spring starts on the written files: the runner finds the admin marker of the
 * wizard, makes the admin with the admin password {@code 1234} and no must-change flag, and sets the setup state
 * {@code REQUIRED}. The marker is stored in the form that the wizard writes with the plain driver. The context starts
 * without a marker, so its own run at the start does nothing; each test stores its marker and runs the runner again.
 */
@MongoIntegrationTest
class SetupCompletionRunnerTest {

	private static final TenantId TENANT = TenantId.SELF_HOST;

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		LocalMongo.register(registry, SetupCompletionRunnerTest.class, () -> dataDir);
	}

	@Autowired
	SetupCompletionRunner runner;

	@Autowired
	UserService userService;

	@Autowired
	UserRepository users;

	@Autowired
	PasswordEncoder passwordEncoder;

	@Autowired
	MongoTemplate mongo;

	@BeforeEach
	void removeUsersAndSetupState() {
		mongo.remove(new Query(), UserDocument.class);
		mongo.getCollection("setup_state").drop();
	}

	@Test
	void runMakesAdminFromMarkerWithFixedPasswordAndNoMustChangeFlag() {
		storeMarker("root");

		run();

		UserDocument admin = users.findByTenantIdAndUsername(TENANT.value(), "root").orElseThrow();
		assertThat(admin.roles()).containsExactly(UserService.ADMIN_ROLE);
		assertThat(passwordEncoder.matches("1234", admin.passwordHash())).isTrue();
		// The record as a tester reads it in the database: no must-change flag and no lock.
		Document raw = mongo.getCollection("users").find(new Document("username", "root")).first();
		assertThat(raw).isNotNull();
		assertThat(raw.getBoolean("mustChangePassword")).isFalse();
		assertThat(raw.getBoolean("locked")).isFalse();
	}

	@Test
	void runSetsStateRequiredAfterTheAdmin() {
		storeMarker("root");

		run();

		Document state = state();
		assertThat(state.getString("state")).isEqualTo("REQUIRED");
		// The admin username belongs to the marker only.
		assertThat(state).doesNotContainKey("adminUsername");
		assertThat(userService.adminExists(TENANT)).isTrue();
	}

	@Test
	void runOnlySetsRequiredWhenAdminExistsAndMarkerRemains() {
		// A crash after the admin and before the state REQUIRED leaves the admin and the marker.
		UserCreated first = userService.createAdmin(
				new CreateAdminCommand(TENANT, "root", "Changed-Password-7".toCharArray(), false, false));
		String hash = users.findById(first.id()).orElseThrow().passwordHash();
		storeMarker("root");

		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertThat(users.findById(first.id()).orElseThrow().passwordHash()).isEqualTo(hash);
		assertThat(state().getString("state")).isEqualTo("REQUIRED");
	}

	@Test
	void runDoesNothingWhenNoMarkerExists() {
		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isZero();
		assertThat(state()).isNull();
	}

	@Test
	void runWritesNoSecretToLoggerOutput() {
		storeMarker("root");
		var appender = new ListAppender<ILoggingEvent>();
		appender.start();
		var rootLogger = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
		rootLogger.addAppender(appender);
		try {
			run();
		}
		finally {
			rootLogger.detachAppender(appender);
		}

		// The events of this thread: the run and what it calls. The monitor threads of the driver log on their own.
		String thread = Thread.currentThread().getName();
		List<String> lines = appender.list.stream().filter(event -> event.getThreadName().equals(thread))
				.map(ILoggingEvent::getFormattedMessage).toList();
		String hash = users.findByTenantIdAndUsername(TENANT.value(), "root").orElseThrow().passwordHash();
		assertThat(lines).anySatisfy(line -> assertThat(line).contains("'root'"));
		assertThat(String.join("\n", lines)).doesNotContain("1234").doesNotContain(hash);
	}

	private void run() {
		runner.run(new DefaultApplicationArguments());
	}

	/** The marker as the wizard writes it before Spring starts. */
	private void storeMarker(String adminUsername) {
		mongo.getCollection("setup_state").insertOne(new Document("_id", TENANT.value()).append("state", "PENDING_ADMIN")
				.append("adminUsername", adminUsername));
	}

	private Document state() {
		return mongo.getCollection("setup_state").find(new Document("_id", TENANT.value())).first();
	}

}
