package io.opencelium.core.setup;

import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.dao.DataAccessResourceFailureException;
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
import io.opencelium.core.tenant.CurrentTenant;
import io.opencelium.core.tenant.TenantRunner;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.MongoIntegrationTest;
import io.opencelium.core.testsupport.TenantTasks;
import io.opencelium.core.user.CreateAdminCommand;
import io.opencelium.core.user.UserCreated;
import io.opencelium.core.user.UserDocument;
import io.opencelium.core.user.UserService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.data.mongodb.core.query.Criteria.where;

/**
 * The second half of the setup, after Spring starts: the runner finds the admin marker of the wizard, makes the admin
 * with the admin password {@code 1234} and no must-change flag, and deletes the marker. Without a marker, it makes the
 * default admin on a database without an OpenCelium user. The marker is stored in the form that the wizard writes
 * with the plain driver. Each test empties the users and the markers, then runs the runner again. The test reads and
 * writes the OpenCelium users with the plain template, without the tenant limit of the user service.
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
	PasswordEncoder passwordEncoder;

	@Autowired
	MongoTemplate mongo;

	@Autowired
	AdminMarkerRepository markers;

	@Autowired
	TenantRunner tenantRunner;

	@Autowired
	CurrentTenant currentTenant;

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
		assertThat(adminExists()).isTrue();
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

		assertThat(storedUser("root").orElseThrow().roles()).containsExactly(UserService.ADMIN_ROLE);
		assertThat(marker()).isNull();
	}

	@Test
	void runStopsAndKeepsTheMarkerWhenTheUsernameBelongsToANonAdminUser() {
		// The unique index refuses the admin, but no admin exists: the start must not pretend that one does.
		storeNonAdminUser("root");
		storeMarker("root");

		assertThatIllegalStateException().isThrownBy(this::run).withMessageContaining("'root'");
		assertThat(adminExists()).isFalse();
		assertThat(marker().getString("adminUsername")).isEqualTo("root");
	}

	@Test
	void runOnlyDeletesTheMarkerWhenTheAdminExists() {
		// A start that stops after the admin and before the delete leaves the admin and the marker.
		UserCreated first = TenantTasks.call(tenantRunner, TENANT, () -> userService
				.createAdmin(new CreateAdminCommand("root", "Changed-Password-7".toCharArray(), false, false)));
		String hash = mongo.findById(first.id(), UserDocument.class).passwordHash();
		storeMarker("root");

		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertThat(mongo.findById(first.id(), UserDocument.class).passwordHash()).isEqualTo(hash);
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
	void runMakesTheDefaultAdminWhenOnlyAnotherTenantHasUsers() {
		// The users of another tenant in the same database are not users of the self-host tenant.
		Instant now = Instant.now();
		mongo.insert(new UserDocument(null, "other", "alice", null, "{noop}x", Set.of("USER"), false, now, false,
				false, now));

		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(2);
		assertAdminWithFixedPasswordAndNoMustChangeFlag("admin");
	}

	@ParameterizedTest
	@ValueSource(strings = {"", "root"})
	void runMakesTheAdminForTheSelfHostTenantWhenTheModeIsSelfHost(String markerUsername) {
		// The admin of the start is work of the 1 tenant of the installation, with and without the marker of the wizard.
		String admin = markerUsername.isEmpty() ? "admin" : markerUsername;
		if (!markerUsername.isEmpty()) {
			storeMarker(markerUsername);
		}
		List<TenantId> currentTenants = new ArrayList<>();
		UserService recording = mock(UserService.class);
		when(recording.anyUserExists()).thenAnswer(invocation -> {
			currentTenants.add(currentTenant.get());
			return userService.anyUserExists();
		});
		when(recording.adminExists()).thenAnswer(invocation -> {
			currentTenants.add(currentTenant.get());
			return userService.adminExists();
		});
		when(recording.createAdmin(any())).thenAnswer(invocation -> {
			currentTenants.add(currentTenant.get());
			return userService.createAdmin(invocation.getArgument(0));
		});

		selfHostRunner(recording).run(new DefaultApplicationArguments());

		assertThat(currentTenants).hasSize(2).containsOnly(TenantId.SELF_HOST);
		assertThat(storedUser(admin)).isPresent();
	}

	@Test
	void runMakesNoAdminWhenNoMarkerAndAnOpenCeliumUserExists() {
		// A database with users and no admin: a deleted admin must not come back with the admin password 1234.
		storeNonAdminUser("alice");

		run();

		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertThat(adminExists()).isFalse();
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

		String hash = storedUser("root").orElseThrow().passwordHash();
		assertThat(lines).anySatisfy(line -> assertThat(line).contains("'root'"));
		assertThat(String.join("\n", lines)).doesNotContain("1234").doesNotContain(hash);
	}

	@Test
	void runLogsTheUsernameAndTheLoginPageWithoutThePasswordWhenItMakesTheDefaultAdmin() {
		// A container has no console for a box: the log tells the operator where to log in.
		List<String> lines = loggedLinesOf(this::run);

		String hash = storedUser("admin").orElseThrow().passwordHash();
		assertThat(lines).anySatisfy(line -> assertThat(line).contains("'admin'", "/login"));
		assertThat(String.join("\n", lines)).doesNotContain("1234").doesNotContain(hash);
	}

	@ParameterizedTest
	@EnumSource(Refusal.class)
	void runDeletesTheMarkerWhenAnotherProcessMadeTheAdminOfTheMarkerFirst(Refusal refusal) {
		storeMarker("root");

		assertThatCode(() -> selfHostRunner(racing(refusal)).run(new DefaultApplicationArguments()))
				.doesNotThrowAnyException();
		assertThat(storedUser("root")).isPresent();
		assertThat(mongo.count(new Query(), UserDocument.class)).isEqualTo(1);
		assertThat(marker()).isNull();
	}

	@ParameterizedTest
	@EnumSource(Refusal.class)
	void runContinuesWhenAnotherProcessMadeTheDefaultAdminFirst(Refusal refusal) {
		// 2 processes start on an empty database at the same time, for example 2 containers.
		assertThatCode(() -> selfHostRunner(racing(refusal)).run(new DefaultApplicationArguments()))
				.doesNotThrowAnyException();
		assertThat(storedUser("admin")).isPresent();
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
	 * A user service that loses the race: the queries go to the real user service, and when the runner makes the
	 * admin, another process inserts the same admin first. Then the real user service refuses the call of the runner,
	 * by its admin check or by the unique index on the tenant and the username.
	 */
	private UserService racing(Refusal refusal) {
		UserService racing = mock(UserService.class);
		when(racing.anyUserExists()).thenAnswer(invocation -> userService.anyUserExists());
		when(racing.adminExists()).thenAnswer(invocation -> userService.adminExists());
		when(racing.createAdmin(any())).thenAnswer(invocation -> {
			CreateAdminCommand command = invocation.getArgument(0);
			userService.createAdmin(new CreateAdminCommand(command.username(), "1234".toCharArray(), false, false));
			if (refusal == Refusal.ADMIN_CHECK) {
				return userService.createAdmin(command);
			}
			Instant now = Instant.now();
			return mongo.insert(new UserDocument(null, TENANT.value(), command.username(), null, "{noop}x",
					Set.of(UserService.ADMIN_ROLE), false, now, false, false, now));
		});
		return racing;
	}

	private void run() {
		runner.run(new DefaultApplicationArguments());
	}

	private SetupCompletionRunner cloudRunner() {
		return new SetupCompletionRunner(markers, userService, tenantRunner,
				new OpenCeliumProperties(DeploymentMode.CLOUD, dataDir, Optional.empty()));
	}

	private SetupCompletionRunner selfHostRunner(UserService userService) {
		return new SetupCompletionRunner(markers, userService, tenantRunner,
				new OpenCeliumProperties(DeploymentMode.SELF_HOST, dataDir, Optional.empty()));
	}

	private void assertAdminWithFixedPasswordAndNoMustChangeFlag(String username) {
		UserDocument admin = storedUser(username).orElseThrow();
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
		mongo.insert(new UserDocument(null, TENANT.value(), username, null, "{noop}x", Set.of("USER"), false, now,
				false, false, now));
	}

	private Optional<UserDocument> storedUser(String username) {
		return Optional.ofNullable(mongo.findOne(new Query(where("tenantId").is(TENANT.value()).and("username")
				.is(username)), UserDocument.class));
	}

	private boolean adminExists() {
		return mongo.exists(new Query(where("tenantId").is(TENANT.value()).and("roles").is(UserService.ADMIN_ROLE)),
				UserDocument.class);
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
