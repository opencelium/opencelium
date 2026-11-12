package io.opencelium.core.setup;

import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.user.CreateAdminCommand;
import io.opencelium.core.user.UserCreated;
import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserRepository;
import io.opencelium.core.user.UserService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The second half of the setup, after Spring starts: the runner finds the admin marker of the wizard, makes the admin
 * with the admin password {@code 1234} and no must-change flag, and deletes the marker. Without a marker, it makes the
 * default admin on a database without an OpenCelium user. The marker is stored in the form that the wizard writes
 * with the plain driver. Each test empties the users and the markers, then runs the runner again.
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

	@Autowired
	AdminMarkerRepository markers;

	@BeforeEach
	void removeUsersAndMarkers() {
		mongo.remove(new Query(), UserDocument.class);
		mongo.getCollection("admin_marker").drop();
	}

	@Test
	void runMakesAdminFromMarkerWithFixedPasswordAndNoMustChangeFlag() {
		storeMarker("root");

		run();

		assertAdminWithFixedPasswordAndNoMustChangeFlag("root");
	}

	@Test
	void runDeletesTheMarkerAfterTheAdmin() {
		storeMarker("root");

		run();

		assertThat(marker()).isNull();
		assertThat(userService.adminExists(TENANT)).isTrue();
	}

	@Test
	void runKeepsTheMarkerWhenTheAdminCannotBeMade() {
		// A start that stops before the admin exists: the next start must still find the username of the wizard.
		storeMarker("root");
		UserService failing = mock(UserService.class);
		when(failing.createAdmin(any())).thenThrow(new DataAccessResourceFailureException("MongoDB went away"));

		assertThatExceptionOfType(DataAccessResourceFailureException.class)
				.isThrownBy(() -> selfHostRunner(failing).run(new DefaultApplicationArguments()));
		assertThat(marker().getString("adminUsername")).isEqualTo("root");
	}

	@Test
	void runMakesTheAdminFromTheMarkerWhenANonAdminOpenCeliumUserExists() {
		// A database with users and no admin gets its admin through the admin step of setup, which writes a marker.
		storeNonAdminUser("alice");
		storeMarker("root");

		run();

		assertThat(users.findByTenantIdAndUsername(TENANT.value(), "root").orElseThrow().roles())
				.containsExactly(UserService.ADMIN_ROLE);
		assertThat(marker()).isNull();
	}

	@Test
	void runOnlyDeletesTheMarkerWhenTheAdminExists() {
		// A start that stops after the admin and before the delete leaves the admin and the marker.
		UserCreated first = userService.createAdmin(
				new CreateAdminCommand(TENANT, "root", "Changed-Password-7".toCharArray(), false, false));
		String hash = users.findById(first.id()).orElseThrow().passwordHash();
		storeMarker("root");

		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertThat(users.findById(first.id()).orElseThrow().passwordHash()).isEqualTo(hash);
		assertThat(marker()).isNull();
	}

	@Test
	void runMakesTheDefaultAdminWhenNoMarkerAndNoOpenCeliumUserExist() {
		// A start without the wizard, for example in a container without a terminal.
		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertAdminWithFixedPasswordAndNoMustChangeFlag("admin");
	}

	@Test
	void runMakesNoAdminWhenNoMarkerAndAnOpenCeliumUserExists() {
		// A database with users and no admin: a deleted admin must not come back with the admin password 1234.
		storeNonAdminUser("alice");

		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertThat(userService.adminExists(TENANT)).isFalse();
	}

	@Test
	void runDoesNothingInCloudMode() {
		// In the cloud mode the database of the configuration is the system database, and no wizard runs.
		storeMarker("root");

		cloudRunner().run(new DefaultApplicationArguments());

		assertThat(mongo.count(new Query(), UserDocument.class)).isZero();
		assertThat(marker().getString("adminUsername")).isEqualTo("root");
	}

	@Test
	void runMakesNoDefaultAdminInCloudMode() {
		// The Service Portal owns the OpenCelium users of the cloud mode.
		cloudRunner().run(new DefaultApplicationArguments());

		assertThat(mongo.count(new Query(), UserDocument.class)).isZero();
	}

	@Test
	void runStopsNamingTheDocumentWhenTheMarkerHasNoUsername() {
		mongo.getCollection("admin_marker").insertOne(new Document("_id", TENANT.value()));

		assertThatIllegalStateException().isThrownBy(this::run).withMessageContaining("admin_marker")
				.withMessageContaining("adminUsername");
		assertThat(mongo.count(new Query(), UserDocument.class)).isZero();
	}

	@Test
	void runWritesNoSecretToLoggerOutput() {
		storeMarker("root");

		List<String> lines = loggedLinesOf(this::run);

		String hash = users.findByTenantIdAndUsername(TENANT.value(), "root").orElseThrow().passwordHash();
		assertThat(lines).anySatisfy(line -> assertThat(line).contains("'root'"));
		assertThat(String.join("\n", lines)).doesNotContain("1234").doesNotContain(hash);
	}

	@Test
	void runLogsTheUsernameAndTheLoginPageWithoutThePasswordWhenItMakesTheDefaultAdmin() {
		// A container has no console for a box: the log tells the operator where to log in.
		List<String> lines = loggedLinesOf(this::run);

		String hash = users.findByTenantIdAndUsername(TENANT.value(), "admin").orElseThrow().passwordHash();
		assertThat(lines).anySatisfy(line -> assertThat(line).contains("'admin'", "/login"));
		assertThat(String.join("\n", lines)).doesNotContain("1234").doesNotContain(hash);
	}

	@ParameterizedTest
	@EnumSource(Refusal.class)
	void runDeletesTheMarkerWhenAnotherProcessMadeTheAdminOfTheMarkerFirst(Refusal refusal) {
		storeMarker("root");

		assertThatCode(() -> selfHostRunner(racing(refusal)).run(new DefaultApplicationArguments()))
				.doesNotThrowAnyException();
		assertThat(users.findByTenantIdAndUsername(TENANT.value(), "root")).isPresent();
		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertThat(marker()).isNull();
	}

	@ParameterizedTest
	@EnumSource(Refusal.class)
	void runContinuesWhenAnotherProcessMadeTheDefaultAdminFirst(Refusal refusal) {
		// 2 processes start on an empty database at the same time, for example 2 containers.
		assertThatCode(() -> selfHostRunner(racing(refusal)).run(new DefaultApplicationArguments()))
				.doesNotThrowAnyException();
		assertThat(users.findByTenantIdAndUsername(TENANT.value(), "admin")).isPresent();
		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
	}

	/** The 2 ways in which the user service refuses the admin that another process inserted first. */
	enum Refusal {

		/** The other admin exists before the check of the user service. */
		ADMIN_CHECK,

		/** The other admin arrives after the check, during the hash; the unique index refuses the insert. */
		UNIQUE_INDEX

	}

	/**
	 * A user service that answers "no user and no admin" and then loses the race: another process inserts the same
	 * admin through the real user service, and the call of the runner is refused.
	 */
	private UserService racing(Refusal refusal) {
		UserService racing = mock(UserService.class);
		when(racing.anyUserExists(TENANT)).thenReturn(false);
		when(racing.adminExists(TENANT)).thenReturn(false);
		when(racing.createAdmin(any())).thenAnswer(invocation -> {
			CreateAdminCommand command = invocation.getArgument(0);
			userService.createAdmin(
					new CreateAdminCommand(TENANT, command.username(), "1234".toCharArray(), false, false));
			if (refusal == Refusal.ADMIN_CHECK) {
				return userService.createAdmin(command);
			}
			throw new DuplicateKeyException("E11000 duplicate key error collection: users");
		});
		return racing;
	}

	private void run() {
		runner.run(new DefaultApplicationArguments());
	}

	private SetupCompletionRunner cloudRunner() {
		return new SetupCompletionRunner(markers, userService,
				new OpenCeliumProperties(DeploymentMode.CLOUD, dataDir, Optional.empty()));
	}

	private SetupCompletionRunner selfHostRunner(UserService userService) {
		return new SetupCompletionRunner(markers, userService,
				new OpenCeliumProperties(DeploymentMode.SELF_HOST, dataDir, Optional.empty()));
	}

	private void assertAdminWithFixedPasswordAndNoMustChangeFlag(String username) {
		UserDocument admin = users.findByTenantIdAndUsername(TENANT.value(), username).orElseThrow();
		assertThat(admin.roles()).containsExactly(UserService.ADMIN_ROLE);
		assertThat(passwordEncoder.matches("1234", admin.passwordHash())).isTrue();
		// The record as a tester reads it in the database: no must-change flag and no lock.
		Document raw = mongo.getCollection("users").find(new Document("username", username)).first();
		assertThat(raw).isNotNull();
		assertThat(raw.getBoolean("mustChangePassword")).isFalse();
		assertThat(raw.getBoolean("locked")).isFalse();
	}

	/**
	 * The log lines of this thread while the action runs: the run and what it calls. The monitor threads of the
	 * driver log on their own.
	 */
	private static List<String> loggedLinesOf(Runnable action) {
		var appender = new ListAppender<ILoggingEvent>();
		appender.start();
		var rootLogger = (Logger) LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME);
		rootLogger.addAppender(appender);
		try {
			action.run();
		}
		finally {
			rootLogger.detachAppender(appender);
		}
		String thread = Thread.currentThread().getName();
		return appender.list.stream().filter(event -> event.getThreadName().equals(thread))
				.map(ILoggingEvent::getFormattedMessage).toList();
	}

	private void storeNonAdminUser(String username) {
		Instant now = Instant.now();
		users.insert(new UserDocument(null, TENANT.value(), username, "{noop}x", Set.of("USER"), false, now, false,
				false, now));
	}

	/** The marker as the wizard writes it before Spring starts. */
	private void storeMarker(String adminUsername) {
		mongo.getCollection("admin_marker")
				.insertOne(new Document("_id", TENANT.value()).append("adminUsername", adminUsername));
	}

	private Document marker() {
		return mongo.getCollection("admin_marker").find(new Document("_id", TENANT.value())).first();
	}

}
