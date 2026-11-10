package io.opencelium.core.setup;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.ServerSocket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.Properties;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoTimeoutException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.logging.LogLevel;
import org.springframework.boot.logging.LoggingSystem;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertySourcesPropertyResolver;
import org.springframework.core.env.SimpleCommandLinePropertySource;

import static io.opencelium.core.setup.LaunchDecision.Kind.BOOT;
import static io.opencelium.core.setup.LaunchDecision.Kind.HELP;
import static io.opencelium.core.setup.LaunchDecision.Kind.TEMPLATE;
import static io.opencelium.core.setup.LaunchDecision.Kind.WIZARD;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * What {@code main()} does first: decide whether the setup wizard runs or Spring Boot starts normally, from the
 * arguments, the terminal, the environment, the system properties and the files on disk. All five are injected, so
 * no test needs a real terminal and none reads the developer's own environment.
 * <p>
 * The rules, first match wins: {@code --help}; an unknown command is a usage error; {@code setup} runs the wizard
 * (batch without a terminal or with {@code --batch}); otherwise {@code --batch}, no
 * terminal, a {@code spring.config.*} location, a bootstrap property, or a configuration file means a normal start;
 * and only when nothing at all is configured does the wizard start on its own.
 */
@ExtendWith(OutputCaptureExtension.class)
class SetupLauncherTest {

	private static final String UNRELATED_ARGUMENT = "--logging.level.root=INFO";

	private static final String DRIVER_LOGGER = "org.mongodb.driver";

	@TempDir
	Path workingDir;

	private boolean terminal = true;

	private final Map<String, String> environment = new HashMap<>();

	private final Properties systemProperties = new Properties();

	private final StringWriter out = new StringWriter();

	private final StringWriter err = new StringWriter();

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private String mongoUri = "mongodb://localhost:27017/opencelium";

	private boolean usesTheDriver;

	@Test
	void decideReturnsWizardWhenNothingIsConfigured() {
		LaunchDecision decision = decide();

		assertThat(decision.kind()).isEqualTo(WIZARD);
		assertThat(decision.reason()).isEqualTo("no configuration was found");
		assertThat(decision.batch()).isFalse();
	}

	@Test
	void decideReturnsWizardWhenSetupIsGiven() throws IOException {
		// On demand the wizard also runs when a configuration exists.
		touch("config/application.yml");

		LaunchDecision decision = decide("setup");

		assertThat(decision.kind()).isEqualTo(WIZARD);
		assertThat(decision.reason()).isEqualTo("requested with setup");
		assertThat(decision.batch()).isFalse();
	}

	@Test
	void decideReturnsBatchWizardWhenSetupHasNoTerminal() {
		terminal = false;

		LaunchDecision decision = decide("setup");

		assertThat(decision.kind()).isEqualTo(WIZARD);
		assertThat(decision.batch()).isTrue();
	}

	@Test
	void decideReturnsBatchWizardWhenSetupAndTheFlagAreGiven() {
		LaunchDecision decision = decide("setup", "--batch");

		assertThat(decision.kind()).isEqualTo(WIZARD);
		assertThat(decision.batch()).isTrue();
	}

	@Test
	void decideReturnsBootWhenBatchFlagIsGivenWithoutSetup() {
		assertBoot(decide("--batch"), "the flag --batch");
	}

	@Test
	void decideReturnsBootWhenNoTerminalIsPresent() {
		terminal = false;

		assertBoot(decide(), "no interactive terminal");
	}

	@Test
	void decideReturnsBootWhenSpringConfigLocationIsInArguments() {
		assertBoot(decide("--spring.config.location=/srv/oc/"), "spring.config.location is set");
		assertBoot(decide("--spring.config.additional-location=/srv/oc/"),
				"spring.config.additional-location is set");
		assertBoot(decide("--spring.config.import=/srv/oc/extra.yml"), "spring.config.import is set");
	}

	@Test
	void decideReturnsBootWhenSpringConfigLocationIsInSystemProperties() {
		systemProperties.setProperty("spring.config.location", "/srv/oc/");

		assertBoot(decide(), "spring.config.location is set");
	}

	@Test
	void decideReturnsBootWhenSpringConfigLocationIsInEnvironment() {
		for (String variable : List.of("SPRING_CONFIG_LOCATION", "SPRING_CONFIG_ADDITIONALLOCATION",
				"SPRING_CONFIG_ADDITIONAL_LOCATION", "SPRING_CONFIG_IMPORT")) {
			environment.clear();
			environment.put(variable, "/srv/oc/");

			assertBoot(decide(), variable + " is set");
		}
	}

	@Test
	void decideReturnsBootWhenBootstrapPropertyIsInEnvironment() {
		// docker run -it has a terminal; an operator who configures through the environment never gets the wizard.
		for (String variable : List.of("OPENCELIUM_DEPLOYMENTMODE", "OPENCELIUM_DATADIR", "SPRING_MONGODB_URI",
				"SPRING_MONGODB_HOST", "SERVER_PORT")) {
			environment.clear();
			environment.put(variable, "x");

			assertBoot(decide(), variable + " is set");
		}
	}

	@Test
	void decideReturnsBootWhenBootstrapPropertyIsInArguments() {
		assertBoot(decide("--opencelium.data-dir=/srv/oc"), "opencelium.data-dir is set");
		assertBoot(decide("--spring.mongodb.uri=mongodb://db.example/oc"), "spring.mongodb.uri is set");
		assertBoot(decide("--server.port=9091"), "server.port is set");
	}

	@Test
	void decideIgnoresUnrelatedArgumentsAndVariables() {
		environment.put("PATH", "/usr/bin");
		environment.put("SPRING_PROFILES_ACTIVE", "dev");
		environment.put("HOME", workingDir.toString());

		assertThat(decide(UNRELATED_ARGUMENT).kind()).isEqualTo(WIZARD);
	}

	@Test
	void decideReturnsBootWhenConfigFileExists() throws IOException {
		Path file = touch("config/application.yml");

		LaunchDecision decision = decide(UNRELATED_ARGUMENT);

		assertBoot(decision, "a configuration was found at " + file);
		assertThat(decision.springArguments()).containsExactly(UNRELATED_ARGUMENT);
	}

	@Test
	void decideAddsAdditionalLocationWhenConfigFileIsInSystemDirectory() throws IOException {
		// Boot does not look in /etc/opencelium by itself, so what the launcher found is what Boot must load.
		Path file = touch("etc/opencelium/application.yml");

		LaunchDecision decision = decide(UNRELATED_ARGUMENT);

		assertBoot(decision, "a configuration was found at " + file);
		assertThat(decision.springArguments()).containsExactly(UNRELATED_ARGUMENT,
				"--spring.config.additional-location=optional:file:" + file.getParent() + "/");
	}

	@Test
	void decideGivesTheSystemDirectoryToBootWhenNoTerminalIsAttached() throws IOException {
		// systemd starts the service without a terminal and in /: Boot must still read /etc/opencelium.
		terminal = false;
		Path file = touch("etc/opencelium/application.yml");

		LaunchDecision decision = decide(UNRELATED_ARGUMENT);

		assertBoot(decision, "no interactive terminal");
		assertThat(decision.springArguments()).containsExactly(UNRELATED_ARGUMENT,
				"--spring.config.additional-location=optional:file:" + file.getParent() + "/");
	}

	@Test
	void decideGivesTheSystemDirectoryToBootWhenBatchOrABootstrapVariableIsSet() throws IOException {
		Path file = touch("etc/opencelium/application.yml");
		String location = "--spring.config.additional-location=optional:file:" + file.getParent() + "/";

		LaunchDecision batch = decide("--batch");
		environment.put("SPRING_MONGODB_URI", "mongodb://db.example/oc");
		LaunchDecision variable = decide();

		assertBoot(batch, "the flag --batch");
		assertThat(batch.springArguments()).containsExactly(location);
		assertBoot(variable, "SPRING_MONGODB_URI is set");
		assertThat(variable.springArguments()).containsExactly(location);
	}

	@Test
	void decideGivesNoSystemDirectoryWhenTheWorkingDirectoryHasAConfiguration() throws IOException {
		// The first match of the search wins; an additional location would take priority over ./config/ in Boot.
		terminal = false;
		touch("config/application.yml");
		touch("etc/opencelium/application.yml");

		LaunchDecision decision = decide(UNRELATED_ARGUMENT);

		assertBoot(decision, "no interactive terminal");
		assertThat(decision.springArguments()).containsExactly(UNRELATED_ARGUMENT);
	}

	@Test
	void decideGivesNoSystemDirectoryWhenASpringConfigLocationIsSet() throws IOException {
		// The operator named the configuration; the launcher adds nothing to it.
		terminal = false;
		touch("etc/opencelium/application.yml");

		LaunchDecision decision = decide("--spring.config.location=/srv/oc/");

		assertBoot(decision, "no interactive terminal");
		assertThat(decision.springArguments()).containsExactly("--spring.config.location=/srv/oc/");
	}

	@Test
	void decideStripsWizardArgumentsFromSpringArguments() {
		LaunchDecision decision = decide("setup", "--file", "a.yml", "--batch", UNRELATED_ARGUMENT);

		assertThat(decision.springArguments()).containsExactly(UNRELATED_ARGUMENT);
	}

	@Test
	void decideCarriesFilePathWhenFlagIsGiven() {
		assertThat(decide("setup", "--file", "a.yml").setupFile()).contains(Path.of("a.yml"));
		assertThat(decide("setup").setupFile()).isEmpty();
	}

	@Test
	void decideThrowsUsageErrorWhenFileIsGivenWithoutSetup() {
		// Without setup the file would be dropped silently: a fresh install would ask everything, a configured one
		// would boot without it.
		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> decide("--file", "a.yml"))
				.withMessage("--file needs the setup command: java -jar oc-app.jar setup --file <path>.")
				.extracting(SetupFailedException::exitCode).isEqualTo(2);
	}

	@Test
	void launchReturnsExitCodeTwoAndPrintsUsageWhenFileIsGivenWithoutSetup() {
		terminal = false;
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"--file", "a.yml"}, booted::set);

		assertThat(exitCode).hasValue(2);
		assertThat(err.toString()).contains("--file needs the setup command").contains("Usage:");
		assertThat(booted.get()).isNull();
	}

	@Test
	void decideReturnsTemplateWhenSetupTemplateIsGiven() {
		// Also without a terminal: the template is meant to be piped into a file.
		terminal = false;

		LaunchDecision decision = decide("setup", "--template", "--file", "ignored.yml");

		assertThat(decision.kind()).isEqualTo(TEMPLATE);
	}

	@Test
	void decideThrowsUsageErrorWhenTemplateIsGivenWithoutSetup() {
		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> decide("--template"))
				.withMessage("--template needs the setup command: java -jar oc-app.jar setup --template.")
				.extracting(SetupFailedException::exitCode).isEqualTo(2);
	}

	@Test
	void launchPrintsTheTemplateWithThisHostsDefaultsAndExitsZero() {
		terminal = false;
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"setup", "--template"}, booted::set);

		assertThat(exitCode).hasValue(0);
		assertThat(out.toString())
				.startsWith("# OpenCelium setup file. Run: java -jar oc-app.jar setup --file <this file>")
				.contains("\n# Where OpenCelium keeps its local state").contains("\ndata-dir: ")
				.contains("\n# The HTTP port of the web interface").contains("\nport: 9090\n");
		assertThat(err.toString()).isEmpty();
		assertThat(console.output()).isEmpty();
		assertThat(booted.get()).isNull();
	}

	@Test
	void launchPrintsAMissingValueOnStandardErrorLikeEveryOtherFailure() throws IOException {
		terminal = false;
		Path file = Files.writeString(workingDir.resolve("setup-values.yml"),
				"data-dir: " + workingDir.resolve("data") + "\n");
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"setup", "--file", file.toString()}, booted::set);

		assertThat(exitCode).hasValue(1);
		assertThat(err.toString()).isEqualTo("Missing value: port in " + file + "\n"
				+ "A template with every key: java -jar oc-app.jar setup --template\n");
		assertThat(console.output()).contains("(from " + file + ")").doesNotContain("Missing value");
		assertThat(workingDir.resolve("config")).doesNotExist();
		assertThat(booted.get()).isNull();
	}

	@Test
	void launchPrintsAWriteFailureOnStandardError() throws IOException {
		Files.writeString(workingDir.resolve("config"), "a file where the directory is needed");
		console.type("", String.valueOf(freePort()), "");
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[0], booted::set);

		assertThat(exitCode).hasValue(1);
		assertThat(err.toString()).startsWith("Cannot write " + workingDir.resolve("config/application.yml") + ": ")
				.endsWith("\nNothing was written.\n");
		assertThat(console.output()).doesNotContain("Cannot write");
		assertThat(booted.get()).isNull();
	}

	@Test
	void decideReturnsHelpWhenHelpIsGiven() {
		assertThat(decide("--help").kind()).isEqualTo(HELP);
	}

	@Test
	void launchReturnsExitCodeTwoAndPrintsUsageWhenCommandIsUnknown() {
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"install-service"}, booted::set);

		assertThat(exitCode).hasValue(2);
		assertThat(err.toString()).contains("Unknown command 'install-service'").contains("Usage:");
		assertThat(booted.get()).isNull();
	}

	@Test
	void launchReturnsZeroAndPrintsUsageWhenHelpIsGiven() {
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"--help"}, booted::set);

		assertThat(exitCode).hasValue(0);
		assertThat(out.toString()).contains("Usage:").contains("setup").contains("-f, --file <path>")
				.contains("--template").contains("--batch")
				// Each flag carries an example.
				.contains("setup --template > setup-values.yml").contains("setup --file setup-values.yml --batch");
		assertThat(booted.get()).isNull();
	}

	@Test
	void launchBootsWithStrippedArgumentsWhenConfigured() {
		environment.put("OPENCELIUM_DEPLOYMENTMODE", "self-host");
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"--batch", UNRELATED_ARGUMENT}, booted::set);

		assertThat(exitCode).isEmpty();
		assertThat(booted.get()).containsExactly(UNRELATED_ARGUMENT);
		assertThat(out.toString()).doesNotContain("Setup wizard");
	}

	@Test
	void launchRunsWizardThenBootsOnTheWrittenFilesWhenConfirmed() throws IOException {
		int port = freePort();
		console.type("", String.valueOf(port), "");
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {UNRELATED_ARGUMENT}, booted::set);

		assertThat(exitCode).isEmpty();
		assertThat(console.output()).contains("OpenCelium").contains("No configuration was found.")
				.contains("  Data directory  [").contains("  Web port        [9090]: ").contains("+-- Summary ")
				.contains("  Write the files and start OpenCelium? [Y/n]: ")
				.contains("  OK Configuration written to " + workingDir.resolve("config")
						+ "\n  -> Starting OpenCelium...")
				.doesNotContain("Cloud");
		assertThat(workingDir.resolve("config/application.yml")).content().contains("port: " + port);
		assertThat(workingDir.resolve("config/opencelium.env")).exists();
		// The start gets the entries of the env file, because this process does not have them.
		assertThat(booted.get()).containsExactly(UNRELATED_ARGUMENT, "--OC_MONGO_URI=" + mongoUri);
	}

	@Test
	void launchPassesTheEntriesOfTheEnvFileToTheStart() throws IOException {
		mongoUri = "mongodb://oc:s3cr%40t@db.example/opencelium?authSource=admin";
		console.type("", String.valueOf(freePort()), "");
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {UNRELATED_ARGUMENT}, booted::set);

		// This process does not have the variable; the start gets it from the wizard, a later start from the env file.
		assertThat(exitCode).isEmpty();
		assertThat(workingDir.resolve("config/opencelium.env")).content().contains("OC_MONGO_URI=\"" + mongoUri + "\"");
		assertThat(booted.get()).startsWith(UNRELATED_ARGUMENT);
		// The placeholder that the written application.yml holds resolves to the URI, percent-encoding included.
		assertThat(startedEnvironment(booted.get()).resolveRequiredPlaceholders("${OC_MONGO_URI}")).isEqualTo(mongoUri);
		assertThat(console.output()).doesNotContain("s3cr");
	}

	@Test
	void launchPrintsNoDriverLogLineWhenTheWizardUsesTheDriver(CapturedOutput output) throws IOException {
		LoggingSystem logging = LoggingSystem.get(getClass().getClassLoader());
		LogLevel rootLevel = logging.getLoggerConfiguration(LoggingSystem.ROOT_LOGGER_NAME).getConfiguredLevel();
		// Before Spring starts, the driver logs at the level of the root logger.
		logging.setLogLevel(DRIVER_LOGGER, null);
		usesTheDriver = true;
		console.type("", String.valueOf(freePort()), "");
		try {
			OptionalInt exitCode = launcher().launch(new String[0], args -> {
			});

			assertThat(exitCode).isEmpty();
		}
		finally {
			logging.setLogLevel(DRIVER_LOGGER, null);
			logging.setLogLevel(LoggingSystem.ROOT_LOGGER_NAME, rootLevel);
		}
		assertThat(output).doesNotContain(DRIVER_LOGGER);
	}

	@Test
	void launchWritesNothingAndBootsNothingWhenSummaryIsDeclined() throws IOException {
		console.type("", String.valueOf(freePort()), "n");
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[0], booted::set);

		assertThat(exitCode).hasValue(0);
		assertThat(console.output()).contains("Setup cancelled. Nothing was written.");
		assertThat(workingDir.resolve("config")).doesNotExist();
		assertThat(booted.get()).isNull();
	}

	@Test
	void launchStopsWithExitCodeOneWhenSetupHasNoTerminalAndNoSetupFile() {
		terminal = false;
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"setup"}, booted::set);

		assertThat(exitCode).hasValue(1);
		assertThat(err.toString()).contains("interactive terminal").contains("--file");
		assertThat(booted.get()).isNull();
	}

	@Test
	void launchStopsNamingTheFileWhenSetupFileIsMissing() {
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"setup", "--file", "missing.yml"}, booted::set);

		assertThat(exitCode).hasValue(1);
		assertThat(err.toString()).contains("The setup file missing.yml does not exist.");
		assertThat(booted.get()).isNull();
	}

	@Test
	void launchWritesTheFilesWithoutATerminalWhenSetupFileIsComplete() throws IOException {
		terminal = false;
		Path file = Files.writeString(workingDir.resolve("setup-values.yml"),
				"data-dir: " + workingDir.resolve("data") + "\nport: " + freePort() + "\n");
		AtomicReference<String[]> booted = new AtomicReference<>();

		OptionalInt exitCode = launcher().launch(new String[] {"setup", "--file", file.toString()}, booted::set);

		assertThat(exitCode).isEmpty();
		assertThat(console.output()).contains("(from " + file + ")").contains("yes   (batch)")
				.doesNotContain("[Y/n]");
		assertThat(workingDir.resolve("config/application.yml")).content()
				.contains("data-dir: " + workingDir.resolve("data"));
		assertThat(booted.get()).containsExactly("--OC_MONGO_URI=" + mongoUri);
	}

	private LaunchDecision decide(String... args) {
		return launcher().decide(args);
	}

	/**
	 * The steps of a full setup, with a MongoDB step that answers {@link #mongoUri} without a question: the launcher
	 * tests do not depend on a server on this host. With {@link #usesTheDriver} the step first pings a closed port
	 * through the driver, which logs as for a real server.
	 */
	private SetupLauncher launcher() {
		var locations = new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium"));
		SetupStep mongo = (context, prompter) -> {
			if (usesTheDriver) {
				pingAClosedPort();
			}
			context.setMongoUri(mongoUri);
		};
		List<SetupStep> steps = List.of(new DataDirStep(), new PortStep(), mongo, new SummaryStep(locations));
		return new SetupLauncher(() -> terminal, environment, systemProperties, locations, steps, console,
				new PrintWriter(out, true), new PrintWriter(err, true));
	}

	/** A ping through the driver, as the code before Spring does it; the driver logs the client and the failure. */
	private static void pingAClosedPort() {
		var settings = MongoClientSettings.builder()
				.applyConnectionString(new ConnectionString("mongodb://localhost:1/opencelium"))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(1, TimeUnit.SECONDS)).build();
		try (MongoClient client = MongoClients.create(settings)) {
			client.getDatabase("opencelium").runCommand(new Document("ping", 1));
		}
		catch (MongoTimeoutException ex) {
			// Expected: nothing listens on port 1.
		}
	}

	/** Resolves as the started application would from its arguments alone, without the environment of this host. */
	private static PropertySourcesPropertyResolver startedEnvironment(String[] args) {
		var sources = new MutablePropertySources();
		sources.addFirst(new SimpleCommandLinePropertySource(args));
		return new PropertySourcesPropertyResolver(sources);
	}

	private static void assertBoot(LaunchDecision decision, String reason) {
		assertThat(decision.kind()).isEqualTo(BOOT);
		assertThat(decision.reason()).isEqualTo(reason);
	}

	private static int freePort() throws IOException {
		try (ServerSocket socket = new ServerSocket(0)) {
			return socket.getLocalPort();
		}
	}

	private Path touch(String relative) throws IOException {
		Path file = workingDir.resolve(relative);
		Files.createDirectories(file.getParent());
		return Files.writeString(file, "");
	}

}
