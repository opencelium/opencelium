package io.opencelium.core.setup;

import java.io.Console;
import java.io.PrintWriter;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.OptionalInt;
import java.util.Properties;
import java.util.TreeSet;
import java.util.function.BooleanSupplier;
import java.util.function.Consumer;
import java.util.function.Predicate;

import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.values.SetupValues;
import io.opencelium.core.setup.values.SetupFile;
import io.opencelium.core.setup.values.SetupFileTemplate;
import io.opencelium.core.setup.prompt.ConsoleIo;
import io.opencelium.core.setup.prompt.ConsolePrompter;

import io.opencelium.core.setup.LaunchDecision.Kind;

/**
 * The first thing {@code main()} does: decide whether the setup wizard runs or Spring Boot starts normally. The
 * rules, first match wins:
 * <ol>
 * <li>{@code --help}: the usage text.</li>
 * <li>A bare word other than {@code setup}, or {@code --file} or {@code --template} without {@code setup}: a usage
 * error, exit code 2. Both flags only mean something to the setup; without it the file would be dropped
 * silently.</li>
 * <li>{@code setup --template}: the template of the setup file, also without a terminal, so it can be piped into a
 * file.</li>
 * <li>{@code setup}: the wizard, on demand. Without a terminal or with {@code --batch} it asks nothing:
 * the values come from {@code --file <path>}, and a missing one stops the setup with exit code 1.</li>
 * <li>{@code --batch}: the normal start.</li>
 * <li>No interactive terminal (Docker, systemd, a pipe): the normal start.</li>
 * <li>A {@code spring.config.*} location in the arguments, the system properties or the environment: the normal
 * start; Boot loads what the operator named.</li>
 * <li>A bootstrap property ({@code opencelium.*}, {@code spring.mongodb.*}, {@code server.port}) in the arguments,
 * the system properties or the environment: the normal start. {@code docker run -it} has a terminal, but an
 * operator who configures through the environment does not want questions.</li>
 * <li>A configuration file at one of the {@link ConfigLocations}: the normal start.</li>
 * <li>Otherwise: the wizard.</li>
 * </ol>
 * The terminal, the environment, the system properties, the file locations, the console and the output are all
 * given to the constructor, so the decision and the wizard are testable without a real terminal and without the
 * developer's own environment. Nothing here logs: before Spring starts the log system is not configured, so the
 * console is the only output. On Ctrl+C before the files are written a shutdown hook says that nothing was written;
 * the JVM exits with 130. After the write the application is starting, and its own shutdown runs.
 */
public final class SetupLauncher {

	private static final List<String> CONFIG_LOCATION_PROPERTIES = List.of("spring.config.location",
			"spring.config.additional-location", "spring.config.import");

	/** Both spellings that Boot's relaxed binding accepts for the additional location. */
	private static final List<String> CONFIG_LOCATION_VARIABLES = List.of("SPRING_CONFIG_LOCATION",
			"SPRING_CONFIG_ADDITIONALLOCATION", "SPRING_CONFIG_ADDITIONAL_LOCATION", "SPRING_CONFIG_IMPORT");

	/** The values the wizard would otherwise ask for: name prefixes, with the dot, and one exact name. */
	private static final List<String> BOOTSTRAP_PROPERTY_PREFIXES = List.of("opencelium.", "spring.mongodb.");

	private static final String SERVER_PORT_PROPERTY = "server.port";

	private static final List<String> BOOTSTRAP_VARIABLE_PREFIXES = List.of("OPENCELIUM_", "SPRING_MONGODB_");

	private static final String SERVER_PORT_VARIABLE = "SERVER_PORT";

	private static final String USAGE = """
			Usage: java -jar oc-app.jar [setup] [--file <path>] [--template] [--batch] [--<property>=<value>...]

			Commands
			  setup                 run the setup wizard, also when a configuration exists
			  help, --help, -h      print this text

			Flags
			  -f, --file <path>     with setup: take the values from this setup file; a missing value is asked
			  --template            with setup: print a setup file with every key, its help and this machine's
			                        defaults, for example: setup --template > setup-values.yml
			  --batch               Run in non-interactive mode. Auto-confirms prompts, fails on missing
			                        values, and disables the setup wizard.

			Batch mode, for scripts, Docker, systemd and CI
			  Before: a setup file with every key. Print the template on the target machine, then set the values:
			      java -jar oc-app.jar setup --template > setup-values.yml
			  Then: run the setup with the file and --batch, so that nothing waits for input:
			      java -jar oc-app.jar setup --file setup-values.yml --batch
			  Without a terminal the setup runs in batch mode by itself. The application starts once the files
			  are written. Exit code 1: a missing or bad value; the message names the key and the file.
			  Exit code 2: a usage error. Both go to standard error.

			Every other --<property>=<value> goes to Spring Boot unchanged, for example --server.port=9090.
			""";

	private final BooleanSupplier terminal;

	private final Map<String, String> environment;

	private final Properties systemProperties;

	private final ConfigLocations locations;

	private final ConsoleIo console;

	private final PrintWriter out;

	private final PrintWriter err;

	/**
	 * @param terminal         whether an interactive terminal is attached; asked once for each decision
	 * @param environment      the environment variables ({@code System.getenv()} in production)
	 * @param systemProperties the JVM system properties ({@code -D...})
	 * @param locations        where a configuration file is looked for
	 * @param console          what the wizard reads and writes
	 * @param out              standard output
	 * @param err              standard error, for usage errors
	 */
	public SetupLauncher(BooleanSupplier terminal, Map<String, String> environment, Properties systemProperties,
			ConfigLocations locations, ConsoleIo console, PrintWriter out, PrintWriter err) {
		this.terminal = terminal;
		this.environment = environment;
		this.systemProperties = systemProperties;
		this.locations = locations;
		this.console = console;
		this.out = out;
		this.err = err;
	}

	/** The real terminal, environment, system properties, file system and console of this process. */
	public static SetupLauncher forThisHost() {
		return new SetupLauncher(SetupLauncher::hasInteractiveTerminal, System.getenv(), System.getProperties(),
				ConfigLocations.forThisHost(), ConsoleIo.ofSystemConsole(), new PrintWriter(System.out, true),
				new PrintWriter(System.err, true));
	}

	/**
	 * Decides, then prints the usage, runs the wizard, or starts Spring Boot through {@code boot}.
	 *
	 * @param boot starts the application with the arguments meant for Spring Boot
	 * @return the exit code when the process must end without the application; empty when the application started
	 */
	public OptionalInt launch(String[] args, Consumer<String[]> boot) {
		LaunchDecision decision;
		try {
			decision = decide(args);
		}
		catch (SetupFailedException ex) {
			err.println(ex.getMessage());
			err.println();
			err.print(USAGE);
			err.flush();
			return OptionalInt.of(ex.exitCode());
		}
		if (decision.kind() == Kind.HELP) {
			out.print(USAGE);
			out.flush();
			return OptionalInt.of(0);
		}
		if (decision.kind() == Kind.TEMPLATE) {
			out.print(SetupFileTemplate.render(Wizard.standardSteps(locations)));
			out.flush();
			return OptionalInt.of(0);
		}
		if (decision.kind() == Kind.WIZARD) {
			return runWizard(decision, boot);
		}
		boot.accept(decision.springArguments().toArray(String[]::new));
		return OptionalInt.empty();
	}

	/**
	 * @throws SetupFailedException when the command line cannot be understood (exit code 2)
	 */
	public LaunchDecision decide(String... args) {
		LaunchArguments arguments = LaunchArguments.parse(args);
		List<String> springArguments = arguments.springArguments();
		if (arguments.help()) {
			return new LaunchDecision(Kind.HELP, "help was requested", false, Optional.empty(), springArguments);
		}
		if (arguments.setupFile().isPresent() && !arguments.isSetup()) {
			throw SetupFailedException.usage(LaunchArguments.FILE_FLAG + " needs the setup command: java -jar "
					+ "oc-app.jar " + Subcommand.SETUP.word() + " " + LaunchArguments.FILE_FLAG + " <path>.");
		}
		if (arguments.template() && !arguments.isSetup()) {
			throw SetupFailedException.usage(LaunchArguments.TEMPLATE_FLAG + " needs the setup command: java -jar "
					+ "oc-app.jar " + Subcommand.SETUP.word() + " " + LaunchArguments.TEMPLATE_FLAG + ".");
		}
		if (arguments.template()) {
			return new LaunchDecision(Kind.TEMPLATE, "the setup file template was requested", false,
					Optional.empty(), springArguments);
		}
		boolean interactive = terminal.getAsBoolean();
		if (arguments.isSetup()) {
			return new LaunchDecision(Kind.WIZARD, "requested with " + Subcommand.SETUP.word(),
					arguments.batch() || !interactive, arguments.setupFile(), springArguments);
		}
		if (arguments.batch()) {
			return boot("the flag " + LaunchArguments.BATCH_FLAG, springArguments);
		}
		if (!interactive) {
			return boot("no interactive terminal", springArguments);
		}
		Optional<String> configured = configLocationSetting(springArguments)
				.or(() -> bootstrapSetting(springArguments));
		if (configured.isPresent()) {
			return boot(configured.get() + " is set", springArguments);
		}
		Optional<Path> file = locations.find();
		if (file.isPresent()) {
			return boot("a configuration was found at " + file.get(), withSystemLocation(file.get(), springArguments));
		}
		return new LaunchDecision(Kind.WIZARD, "no configuration was found", false, Optional.empty(), springArguments);
	}

	/**
	 * Runs the wizard on the console, with the setup file when one was given; after the write the wizard starts
	 * the application through {@code boot}. A failure that ends the setup goes to standard error, like a usage
	 * error, so a script finds every failure in one place. The shutdown hook for Ctrl+C says that nothing was
	 * written, as long as that is true.
	 */
	private OptionalInt runWizard(LaunchDecision decision, Consumer<String[]> boot) {
		if (decision.batch() && decision.setupFile().isEmpty()) {
			err.println("The setup wizard needs an interactive terminal, or a setup file: setup --file <path>.");
			return OptionalInt.of(SetupFailedException.FAILURE_EXIT_CODE);
		}
		SetupValues values;
		try {
			values = decision.setupFile().map(SetupFile::load).orElse(SetupValues.NONE);
		}
		catch (SetupFailedException ex) {
			err.println(ex.getMessage());
			return OptionalInt.of(ex.exitCode());
		}
		var source = new ValueSource(values, decision.setupFile(), decision.batch());
		String[] springArguments = decision.springArguments().toArray(String[]::new);
		var prompter = new ConsolePrompter(console);
		var wizard = new Wizard(prompter, source, Wizard.standardSteps(locations),
				() -> boot.accept(springArguments), Wizard.versionFromManifest());
		Thread cancelHook = new Thread(() -> {
			if (!wizard.hasWritten()) {
				prompter.print("");
				prompter.info(SetupCancelledException.MESSAGE);
			}
		});
		Runtime.getRuntime().addShutdownHook(cancelHook);
		try {
			return wizard.run(decision.reason());
		}
		catch (SetupFailedException ex) {
			err.println(ex.getMessage());
			return OptionalInt.of(ex.exitCode());
		}
		finally {
			try {
				Runtime.getRuntime().removeShutdownHook(cancelHook);
			}
			catch (IllegalStateException ex) {
				// The shutdown has begun (Ctrl+C): the hook runs and prints the message.
			}
		}
	}

	private static LaunchDecision boot(String reason, List<String> springArguments) {
		return new LaunchDecision(Kind.BOOT, reason, false, Optional.empty(), springArguments);
	}

	/** The first {@code spring.config.*} location that is set, by its property or variable name. */
	private Optional<String> configLocationSetting(List<String> springArguments) {
		return firstSet(springArguments, CONFIG_LOCATION_PROPERTIES::contains, CONFIG_LOCATION_VARIABLES::contains);
	}

	/** The first bootstrap value that is set, by its property or variable name. */
	private Optional<String> bootstrapSetting(List<String> springArguments) {
		return firstSet(springArguments, SetupLauncher::isBootstrapProperty, SetupLauncher::isBootstrapVariable);
	}

	/** Arguments first, then system properties, then the environment, each in a fixed order, so the reason is stable. */
	private Optional<String> firstSet(List<String> springArguments, Predicate<String> property,
			Predicate<String> variable) {
		for (String argument : springArguments) {
			if (argument.startsWith("--")) {
				String name = argument.substring(2).split("=", 2)[0];
				if (property.test(name.toLowerCase(Locale.ROOT))) {
					return Optional.of(name);
				}
			}
		}
		for (String name : new TreeSet<>(systemProperties.stringPropertyNames())) {
			if (property.test(name.toLowerCase(Locale.ROOT))) {
				return Optional.of(name);
			}
		}
		for (String name : new TreeSet<>(environment.keySet())) {
			if (variable.test(name)) {
				return Optional.of(name);
			}
		}
		return Optional.empty();
	}

	private static boolean isBootstrapProperty(String name) {
		return name.equals(SERVER_PORT_PROPERTY) || BOOTSTRAP_PROPERTY_PREFIXES.stream().anyMatch(name::startsWith);
	}

	private static boolean isBootstrapVariable(String name) {
		return name.equals(SERVER_PORT_VARIABLE) || BOOTSTRAP_VARIABLE_PREFIXES.stream().anyMatch(name::startsWith);
	}

	/** Boot does not read the system directory by itself, so a file found there becomes an additional location. */
	private List<String> withSystemLocation(Path file, List<String> springArguments) {
		if (!locations.isSystemLocation(file)) {
			return springArguments;
		}
		List<String> withLocation = new ArrayList<>(springArguments);
		withLocation.add("--spring.config.additional-location=optional:file:" + file.getParent() + "/");
		return withLocation;
	}

	/** A console that is a terminal: with some console providers {@code System.console()} is non-null for a pipe. */
	private static boolean hasInteractiveTerminal() {
		Console console = System.console();
		return console != null && console.isTerminal();
	}

}
