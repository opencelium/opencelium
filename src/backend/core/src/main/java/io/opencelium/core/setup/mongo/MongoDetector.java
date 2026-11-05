package io.opencelium.core.setup.mongo;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.Duration;
import java.util.Objects;

import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;

/**
 * Looks for a MongoDB server on this host before the MongoDB step shows its menu: a port that accepts a TCP
 * connection within half a second counts as a server. The probe only connects and closes; it sends nothing, so it
 * needs no login and changes nothing. The address is that of the documented default URI, so the server it finds is
 * the one the application would use without a configuration.
 */
public final class MongoDetector {

	static final String DEFAULT_HOST = "localhost";

	static final int DEFAULT_PORT = 27017;

	private static final Duration TIMEOUT = Duration.ofMillis(500);

	private final String host;

	private final int port;

	public MongoDetector() {
		this(DEFAULT_HOST, DEFAULT_PORT);
	}

	public MongoDetector(String host, int port) {
		this.host = Objects.requireNonNull(host, "host");
		this.port = port;
	}

	public MongoDetection detect() {
		try (var socket = new Socket()) {
			socket.connect(new InetSocketAddress(host, port), (int) TIMEOUT.toMillis());
			return new MongoDetection(true);
		}
		catch (IOException ex) {
			// Refused, unreachable or too slow: no server to offer.
			return new MongoDetection(false);
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
