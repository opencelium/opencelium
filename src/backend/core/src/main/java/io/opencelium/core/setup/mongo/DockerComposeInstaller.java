package io.opencelium.core.setup.mongo;

import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.files.SetupActionException;
import io.opencelium.core.setup.host.CommandRunner;
import io.opencelium.core.setup.host.CommandRunner.Result;
import io.opencelium.core.setup.host.ProcessCommandRunner;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Starts MongoDB for OpenCelium with Docker Compose, as an action of the plan after the summary. The action brings
 * {@code docker-compose.yml} and its {@code .env} for the quickstart directory, which the plan writes with its other
 * files. Then it runs {@code docker compose up -d} there and pings with the start ping of the application until
 * MongoDB accepts the login. The container publishes MongoDB on the loopback address only. On its first start it
 * makes the root user {@code opencelium} with the password from {@code .env}, which only its owner can read;
 * application.yml reaches the same password through the placeholder of the env file. The data is in the volume
 * {@code opencelium_mongo-data}, so {@code docker compose down} keeps it.
 * <p>
 * When the start or the ping fails, the undo runs {@code docker compose down} while the files are still in place. It
 * removes the volume only when this run made it: a volume from an earlier setup holds data, and it keeps the password
 * of that setup, which the failure message then names.
 */
public final class DockerComposeInstaller {

	/** The URI for application.yml: the user of the container, with the placeholder of its password. */
	public static final String URI = "mongodb://opencelium:${" + UriSplitter.PASSWORD_VARIABLE
			+ "}@127.0.0.1:27017/opencelium?authSource=admin";

	/** How long the action waits for the ping after {@code docker compose up -d}. */
	static final Duration TIMEOUT = Duration.ofSeconds(60);

	private static final Duration PAUSE = Duration.ofSeconds(1);

	static final String VOLUME = "opencelium_mongo-data";

	private static final String COMPOSE_FILE = "docker-compose.yml";

	private static final String ENV_FILE = ".env";

	private static final String PLACEHOLDER = "${" + UriSplitter.PASSWORD_VARIABLE + "}";

	/** The password goes into a URI and into {@code .env} as it is, so it needs no encoding and no quotes. */
	private static final Pattern PLAIN_PASSWORD = Pattern.compile("[A-Za-z0-9-]+");

	private static final List<String> VOLUME_INSPECT = List.of("docker", "volume", "inspect", VOLUME);

	/**
	 * The project, the file and the env file are named, so that a {@code compose.yaml}, an override file or a
	 * {@code COMPOSE_*} variable of the shell cannot change what runs or which password the container gets.
	 */
	private static final List<String> COMPOSE_COMMAND = List.of("docker", "compose", "-p", "opencelium", "-f",
			COMPOSE_FILE, "--env-file", ENV_FILE);

	private static final List<String> UP = compose("up", "-d");

	private static final List<String> DOWN = compose("down");

	private static final List<String> DOWN_AND_REMOVE_VOLUME = compose("down", "-v");

	/**
	 * The project name and the volume name are fixed, so that the commands of the setup and an operator who runs
	 * {@code docker compose} in another directory name the same container and the same volume.
	 */
	private static final String COMPOSE = """
			# Written by OpenCelium setup: MongoDB for OpenCelium on this machine.
			# Start it again in this directory with: docker compose up -d
			name: opencelium
			services:
			  mongo:
			    image: mongo:8
			    restart: unless-stopped
			    ports:
			      - "127.0.0.1:27017:27017"
			    environment:
			      MONGO_INITDB_ROOT_USERNAME: opencelium
			      MONGO_INITDB_ROOT_PASSWORD: ${OC_MONGO_PASSWORD:?the password is in .env}
			    volumes:
			      - mongo-data:/data/db
			volumes:
			  mongo-data:
			    name: opencelium_mongo-data
			""";

	private final Path directory;

	private final CommandRunner commands;

	private final Function<MongoConnection, Optional<String>> ping;

	private final Duration timeout;

	private final Duration pause;

	/**
	 * @param directory the quickstart directory, where the compose file and its {@code .env} go
	 */
	public DockerComposeInstaller(Path directory) {
		// A password variable of the shell would win over .env when Compose fills in the compose file.
		this(directory, new ProcessCommandRunner(Set.of(UriSplitter.PASSWORD_VARIABLE)), new MongoStartupPing()::check,
				TIMEOUT, PAUSE);
	}

	/**
	 * @param ping    the cause why MongoDB at a connection cannot be used; empty when it answers and accepts the login
	 * @param timeout how long the action pings before it fails
	 * @param pause   the wait between 2 pings
	 */
	DockerComposeInstaller(Path directory, CommandRunner commands, Function<MongoConnection, Optional<String>> ping,
			Duration timeout, Duration pause) {
		this.directory = Objects.requireNonNull(directory, "directory");
		this.commands = Objects.requireNonNull(commands, "commands");
		this.ping = Objects.requireNonNull(ping, "ping");
		this.timeout = Objects.requireNonNull(timeout, "timeout");
		this.pause = Objects.requireNonNull(pause, "pause");
	}

	/**
	 * The installation as an action of the plan: its 2 files, then the start and the wait for the ping. Nothing is
	 * written or started here.
	 *
	 * @param password the password of the MongoDB user {@code opencelium}; it goes to {@code .env} only
	 * @param prompter where the action prints its progress
	 * @throws IllegalArgumentException when the password has a character other than {@code A-Z a-z 0-9 -}
	 */
	public PlannedAction install(String password, Prompter prompter) {
		if (!PLAIN_PASSWORD.matcher(password).matches()) {
			throw new IllegalArgumentException("The password must have only the characters A-Z, a-z, 0-9 and -.");
		}
		return new Installation(password, Objects.requireNonNull(prompter, "prompter"));
	}

	private static List<String> compose(String... arguments) {
		return Stream.concat(COMPOSE_COMMAND.stream(), Stream.of(arguments)).toList();
	}

	/** One installation. It is not a record, so that no text form of it can show the password. */
	private final class Installation implements PlannedAction {

		private final String password;

		private final Prompter prompter;

		/** Only an inspect that names the volume as absent counts; any other answer keeps the volume. */
		private boolean volumeMadeByThisRun;

		private boolean earlierVolume;

		private Installation(String password, Prompter prompter) {
			this.password = password;
			this.prompter = prompter;
		}

		@Override
		public String description() {
			return "Start MongoDB with Docker Compose in " + directory;
		}

		@Override
		public List<PlannedFile> files() {
			return List.of(PlannedFile.groupReadable(directory.resolve(COMPOSE_FILE), COMPOSE),
					PlannedFile.ownerOnly(directory.resolve(ENV_FILE), "# Written by OpenCelium setup: the password of"
							+ " the MongoDB user opencelium, for docker-compose.yml.\n" + UriSplitter.PASSWORD_VARIABLE
							+ "=" + password + "\n"));
		}

		@Override
		public void run() {
			prompter.progress("Starting MongoDB with Docker Compose in " + directory
					+ "; the first start downloads the image mongo:8...");
			Result inspect = commands.run(directory, VOLUME_INSPECT);
			earlierVolume = inspect.succeeded();
			volumeMadeByThisRun = !inspect.succeeded()
					&& inspect.output().toLowerCase(Locale.ROOT).contains("no such volume");
			Result up = commands.run(directory, UP);
			if (!up.succeeded()) {
				throw new SetupActionException("Cannot start MongoDB with Docker Compose: " + String.join(" ", UP)
						+ " in " + directory + " ended with exit code " + up.exitCode() + ": " + up.lastLine());
			}
			MongoConnection connection = StaticMongoConnectionResolver.parseUri(URI.replace(PLACEHOLDER, password));
			prompter.progress("Waiting for MongoDB at " + connection.redacted() + "...");
			Optional<String> cause = waitForPing(connection);
			if (cause.isPresent()) {
				throw new SetupActionException("MongoDB with Docker Compose does not answer at " + connection.redacted()
						+ " within " + timeout.toSeconds() + " s: " + cause.get() + "."
						+ (earlierVolume ? " The volume " + VOLUME + " is from an earlier setup and keeps the password"
								+ " of that setup." : "")
						+ " The command docker compose logs in " + directory + " shows the log of the container.");
			}
			prompter.success("MongoDB answers at " + connection.redacted());
		}

		@Override
		public Optional<String> undo() {
			List<String> down = volumeMadeByThisRun ? DOWN_AND_REMOVE_VOLUME : DOWN;
			Result result = commands.run(directory, down);
			if (result.succeeded()) {
				return Optional.empty();
			}
			// The rollback deletes the compose file next, so the command by hand names the project instead.
			return Optional.of("Cannot stop MongoDB: " + String.join(" ", down) + " ended with exit code "
					+ result.exitCode() + ": " + result.lastLine() + ". Stop it by hand with: docker compose -p"
					+ " opencelium down");
		}

		private Optional<String> waitForPing(MongoConnection connection) {
			long deadline = System.nanoTime() + timeout.toNanos();
			Optional<String> cause = ping.apply(connection);
			while (cause.isPresent() && System.nanoTime() - deadline < 0 && paused()) {
				cause = ping.apply(connection);
			}
			return cause;
		}

		/** False when the thread is interrupted: the wait then ends with the last cause. */
		private boolean paused() {
			try {
				Thread.sleep(pause);
				return true;
			}
			catch (InterruptedException ex) {
				Thread.currentThread().interrupt();
				return false;
			}
		}

	}

}
