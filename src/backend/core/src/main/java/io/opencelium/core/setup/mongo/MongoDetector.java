package io.opencelium.core.setup.mongo;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Duration;
import java.util.Objects;

import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;

/**
 * Looks for a MongoDB server on this host before the MongoDB step shows its menu. A port that accepts a TCP
 * connection within half a second counts as a server. The probe only connects and closes; it sends nothing, so it
 * needs no login and changes nothing. The address is that of the documented default URI, so the server it finds is
 * the one the application would use without a configuration.
 */
public final class MongoDetector {

	/** The host of the documented default URI. */
	public static final String DEFAULT_HOST = "localhost";

	/** The port of the documented default URI. */
	public static final int DEFAULT_PORT = 27017;

	private static final Duration TIMEOUT = Duration.ofMillis(500);

	private final String host;

	private final int port;

	public MongoDetector() {
		this(DEFAULT_HOST, DEFAULT_PORT);
	}

	/**
	 * @param host the host of the probed address
	 * @param port the port of the probed address
	 */
	public MongoDetector(String host, int port) {
		this.host = Objects.requireNonNull(host, "host");
		this.port = port;
	}

	/** Whether a server accepts a TCP connection on the probed address within half a second. */
	public boolean localServerListens() {
		try (var socket = new Socket()) {
			socket.connect(new InetSocketAddress(host, port), (int) TIMEOUT.toMillis());
			return true;
		}
		catch (IOException ex) {
			// Refused, unreachable or too slow: no server to offer.
			return false;
		}
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
