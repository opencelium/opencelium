package io.opencelium.core.setup;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.OptionalInt;
import java.util.SequencedMap;
import java.util.function.Consumer;
import java.util.function.IntPredicate;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.setup.files.FilePlan;
import io.opencelium.core.setup.files.FilePlanWriter;
import io.opencelium.core.setup.files.SetupWriteException;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.steps.AdminStep;
import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.MasterKeyStep;
import io.opencelium.core.setup.steps.MongoStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;

/**
 * The setup: the banner with the names of the environment variables that give a value, then the steps in order, each
 * one under a title line with its number, the step count and its name, and skipped when it does not apply; then the
 * write of the files and the actions that the steps planned, for example the backup question of a new master key;
 * then the start of the application, and the login box when the application answers on its port. The steps take
 * their values from the value source: the environment, else the setup file, else the prompter. A cancel at any
 * question ends the run with "nothing written" and exit code 0. A missing or bad value in batch mode, a bad value from
 * the environment, a deployment mode other than self-host in the environment, and a write failure, end it with a
 * {@link SetupFailedException} that the launcher prints on standard error, and start nothing. The dialogue goes
 * through the prompter, never through a logger: before Spring starts the log system is not configured, and a password
 * must never reach a log.
 */
public final class Wizard {

	/** After the name of a step that does not apply: its title line stays, so the numbers have no gap. */
	private static final String SKIPPED = " (skipped)";

	/** The host in the URL of the login box: the application starts on this host. */
	private static final String HOST = "localhost";

	private static final Duration PROBE_TIMEOUT = Duration.ofMillis(500);

	private final Prompter prompter;

	private final ValueSource values;

	private final List<SetupStep> steps;

	private final Consumer<SequencedMap<String, String>> start;

	private final Optional<String> version;

	private final IntPredicate portListens;

	private volatile boolean written;

	/**
	 * @param values  where the steps get their values
	 * @param start   starts the application once the files are written, with the entries of the env file: this
	 *                process does not have them in its environment
	 * @param version the product version for the banner; empty when unknown
	 */
	public Wizard(Prompter prompter, ValueSource values, List<SetupStep> steps,
			Consumer<SequencedMap<String, String>> start, Optional<String> version) {
		this(prompter, values, steps, start, version, Wizard::portListensOnThisHost);
	}

	/**
	 * @param portListens whether the application answers on a port of this host, after the start
	 */
	public Wizard(Prompter prompter, ValueSource values, List<SetupStep> steps,
			Consumer<SequencedMap<String, String>> start, Optional<String> version, IntPredicate portListens) {
		this.prompter = Objects.requireNonNull(prompter, "prompter");
		this.values = Objects.requireNonNull(values, "values");
		this.steps = List.copyOf(steps);
		this.start = Objects.requireNonNull(start, "start");
		this.version = Objects.requireNonNull(version, "version");
		this.portListens = Objects.requireNonNull(portListens, "portListens");
	}

	/** The steps of a full setup, in the order the user sees them; the summary writes to {@code locations}. */
	public static List<SetupStep> standardSteps(ConfigLocations locations) {
		return List.of(new DataDirStep(), new PortStep(), new MongoStep(), new MasterKeyStep(), new AdminStep(),
				new SummaryStep(locations));
	}

	/** The version from the jar manifest; empty when the classes run unpacked, for example from the build tool. */
	public static Optional<String> versionFromManifest() {
		return Optional.ofNullable(Wizard.class.getPackage().getImplementationVersion());
	}

	/**
	 * @param reason why the wizard runs, in the words of the launch decision; the banner starts with it
	 * @return the exit code when the process must end: 0 after a cancel, and when no step planned a file. Empty when
	 * the application started.
	 * @throws SetupFailedException with exit code 1 after a missing or bad value in batch mode, a bad value or a
	 *                              deployment mode other than self-host in the environment, and after a write
	 *                              failure; the message names the file, the key or the variable
	 */
	public OptionalInt run(String reason) {
		written = false;
		printBanner(reason);
		printVariables();
		requireSelfHost();
		SetupContext context = new SetupContext(values);
		try {
			for (int i = 0; i < steps.size(); i++) {
				SetupStep step = steps.get(i);
				boolean applicable = step.applicable(context);
				prompter.step(i + 1, steps.size(), applicable ? step.name() : step.name() + SKIPPED);
				if (applicable) {
					step.run(context, prompter);
				}
			}
		}
		catch (SetupCancelledException ex) {
			prompter.print("");
			prompter.info(ex.getMessage());
			return OptionalInt.of(0);
		}
		FilePlan plan = context.filePlan();
		if (plan.isEmpty()) {
			return OptionalInt.of(0);
		}
		try {
			// Written from the moment the files are in place: a Ctrl+C at a question of an action leaves them there.
			new FilePlanWriter(prompter::info).write(plan, () -> written = true);
		}
		catch (SetupWriteException ex) {
			written = false;
			throw SetupFailedException.failure(ex.getMessage(), ex.rollbackReport());
		}
		catch (SetupCancelledException ex) {
			written = false;
			prompter.print("");
			prompter.info(ex.getMessage());
			return OptionalInt.of(0);
		}
		prompter.print("");
		prompter.success("Configuration written to " + plan.files().getFirst().path().getParent());
		prompter.progress("Starting OpenCelium...");
		prompter.print("");
		start.accept(context.environment());
		printLogin(context);
		return OptionalInt.empty();
	}

	/**
	 * Whether the current or last run wrote its files. From then on a Ctrl+C ends the application that is starting,
	 * not the setup, so "nothing was written" would be wrong.
	 */
	public boolean hasWritten() {
		return written;
	}

	/**
	 * The login box, after the start and only when the application answers on its port: the URL of the admin login
	 * page, and the admin username and the admin password of the admin that the start made. After a skipped admin
	 * step the box shows the URL and says that an admin exists in the database, with no username and no admin
	 * password, because that admin can have another admin password. The box goes to the console, never to a logger.
	 */
	private void printLogin(SetupContext context) {
		OptionalInt port = context.port();
		if (port.isEmpty() || !portListens.test(port.getAsInt())) {
			return;
		}
		var rows = new LinkedHashMap<String, String>();
		rows.put("URL", "http://" + HOST + ":" + port.getAsInt() + SetupContext.LOGIN_PAGE);
		context.adminUsername().ifPresentOrElse(username -> {
			rows.put("Admin username", username);
			rows.put("Admin password", SetupContext.FIRST_ADMIN_PASSWORD);
		}, () -> {
			// The box has no wrap: the empty label continues the row above in the value column.
			rows.put("Admin", "exists in the database: log in with its");
			rows.put("", "username and admin password");
		});
		prompter.print("");
		prompter.box("Log in to OpenCelium", rows);
	}

	/** Whether a server on this host accepts a TCP connection on the port within half a second. */
	private static boolean portListensOnThisHost(int port) {
		try (var socket = new Socket()) {
			socket.connect(new InetSocketAddress(HOST, port), (int) PROBE_TIMEOUT.toMillis());
			return true;
		}
		catch (IOException ex) {
			return false;
		}
	}

	/**
	 * The Enter, ? and q hint only when a question can come: the log of a batch run must not suggest a
	 * wait. No empty line at the end: the title line of the first step brings its own.
	 */
	private void printBanner(String reason) {
		prompter.print("");
		prompter.title("OpenCelium setup" + version.map(v -> " (" + v + ")").orElse(""));
		String opening = sentence(reason) + " Let's set up OpenCelium.";
		if (values.batch()) {
			prompter.info(opening);
		}
		else {
			prompter.info(opening, "Press Enter to accept the value in [brackets]. Type ? for help, q to quit.");
		}
	}

	/** The names of the variables that give a value, so the user sees at once what the setup does not ask. */
	private void printVariables() {
		List<String> names = values.environment().names();
		if (!names.isEmpty()) {
			prompter.print("");
			prompter.list("Values from the environment, not asked", names);
		}
	}

	/**
	 * The setup installs the self-host mode only. A variable with another deployment mode would apply at each start,
	 * so the setup stops before the first step instead of writing files for a mode that the start does not use. The
	 * mode is read as the start reads it: the case and {@code _} versus {@code -} do not count.
	 */
	private void requireSelfHost() {
		values.environment().value(OpenCeliumProperties.DEPLOYMENT_MODE).ifPresent(mode -> {
			if (DeploymentMode.parse(mode.text()).filter(SetupContext.DEPLOYMENT_MODE::equals).isEmpty()) {
				String selfHost = SetupContext.DEPLOYMENT_MODE.propertyValue();
				throw SetupFailedException.failure(mode.variable() + " in the environment gives a deployment mode"
						+ " other than " + selfHost + ", and the setup installs the " + selfHost + " mode only.",
						"Remove the variable, or set it to " + selfHost + ". A cloud installation has a hand-written"
								+ " configuration.");
			}
		});
	}

	private static String sentence(String reason) {
		return Character.toUpperCase(reason.charAt(0)) + reason.substring(1) + ".";
	}

}
