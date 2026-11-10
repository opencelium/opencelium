package io.opencelium.core.setup.mongo;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.Objects;

import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.setup.host.CommandRunner;
import io.opencelium.core.setup.host.ProcessCommandRunner;

/**
 * Looks for a MongoDB server and for Docker Compose on this host before the MongoDB step shows its menu. A port that
 * accepts a TCP connection within half a second counts as a server. The probe only connects and closes; it sends
 * nothing, so it needs no login and changes nothing. The address is that of the documented default URI, so the
 * server it finds is the one the application would use without a configuration. Docker Compose counts as present
 * when {@code docker compose version} ends with exit code 0; its output is not shown.
 */
public final class MongoDetector {

	static final String DEFAULT_HOST = "localhost";

	static final int DEFAULT_PORT = 27017;

	private static final Duration TIMEOUT = Duration.ofMillis(500);

	private static final List<String> DOCKER_COMPOSE_VERSION = List.of("docker", "compose", "version");

	private final String host;

	private final int port;

	private final CommandRunner commands;

	public MongoDetector() {
		this(DEFAULT_HOST, DEFAULT_PORT, new ProcessCommandRunner());
	}

	/**
	 * @param commands runs {@code docker compose version}
	 */
	public MongoDetector(String host, int port, CommandRunner commands) {
		this.host = Objects.requireNonNull(host, "host");
		this.port = port;
		this.commands = Objects.requireNonNull(commands, "commands");
	}

	/**
	 * @param host the host of the probed address
	 * @param port the port of the probed address
	 */
	public MongoDetector(String host, int port) {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

	/** Whether a server accepts a TCP connection on the probed address within half a second. */
	public boolean localServerListens() {
		throw new UnsupportedOperationException("Not implemented yet.");
	}

	public MongoDetection detect() {
		return new MongoDetection(localServer(), dockerCompose());
	}

	private boolean localServer() {
		try (var socket = new Socket()) {
			socket.connect(new InetSocketAddress(host, port), (int) TIMEOUT.toMillis());
			return true;
		}
		catch (IOException ex) {
			// Refused, unreachable or too slow: no server to offer.
			return false;
		}
	}

	/**
	 * The plugin answers without the Docker daemon, so the daemon can still be down: then {@code docker compose up}
	 * names that after the summary, and the plan rolls back.
	 */
	private boolean dockerCompose() {
		return commands.run(Path.of("").toAbsolutePath(), DOCKER_COMPOSE_VERSION).succeeded();
	}

	/** The URI of a server on the probed address, without a login, with the default database. */
	public String localUri() {
		return "mongodb://" + host + ":" + port + "/" + StaticMongoConnectionResolver.DEFAULT_DATABASE;
	}

	/** {@code localhost:27017}, for the menu. */
	public String address() {
		return host + ":" + port;
	}

}
