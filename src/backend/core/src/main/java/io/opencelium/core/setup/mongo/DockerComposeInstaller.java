package io.opencelium.core.setup.mongo;

import java.nio.file.Path;
import java.time.Duration;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.host.CommandRunner;
import io.opencelium.core.setup.host.ProcessCommandRunner;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Starts MongoDB for OpenCelium with Docker Compose, as an action of the plan after the summary. The action writes
 * {@code docker-compose.yml} and its {@code .env} into the quickstart directory, runs {@code docker compose up -d}
 * there, and waits until the start ping of the application accepts the login.
 */
public final class DockerComposeInstaller {

	/** The URI for application.yml: the user of the container, with the placeholder of its password. */
	public static final String URI = "mongodb://opencelium:${" + UriSplitter.PASSWORD_VARIABLE
			+ "}@127.0.0.1:27017/opencelium?authSource=admin";

	/** How long the action waits for the ping after {@code docker compose up -d}. */
	static final Duration TIMEOUT = Duration.ofSeconds(60);

	private static final Duration PAUSE = Duration.ofSeconds(1);

	private final Path directory;

	private final CommandRunner commands;

	private final Function<MongoConnection, Optional<String>> ping;

	private final Duration timeout;

	private final Duration pause;

	/**
	 * @param directory the quickstart directory, where the compose file and its {@code .env} go
	 */
	public DockerComposeInstaller(Path directory) {
		this(directory, new ProcessCommandRunner(), new MongoStartupPing()::check, TIMEOUT, PAUSE);
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
	 */
	public PlannedAction install(String password, Prompter prompter) {
		throw new UnsupportedOperationException();
	}

}
