package io.opencelium.core.config.mongo;

import java.net.ConnectException;
import java.net.UnknownHostException;
import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.TimeUnit;

import com.mongodb.MongoCommandException;
import com.mongodb.MongoCredential;
import com.mongodb.MongoException;
import com.mongodb.MongoSecurityException;
import com.mongodb.MongoTimeoutException;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import com.mongodb.connection.ClusterDescription;
import com.mongodb.connection.ServerDescription;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.bson.Document;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.BootstrapPropertyException;

/**
 * Checks MongoDB once at startup and stops the application when it cannot be used: the server must answer, and the
 * configured login (or its absence) must be allowed to list the collections of the database. Uses its own
 * short-lived client with a 5 second timeout, so a wrong URI fails in seconds while the application's client keeps
 * the driver's defaults.
 */
public final class MongoStartupPing {

	static final Duration TIMEOUT = Duration.ofSeconds(5);

	/** MongoDB's error code for "command requires authentication" and "not authorized on database". */
	private static final int UNAUTHORIZED = 13;

	private static final Log log = LogFactory.getLog(MongoStartupPing.class);

	enum Kind { UNREACHABLE, AUTHENTICATION, OTHER }

	record Failure(Kind kind, String reason) {
	}

	public void verify(MongoConnection connection) {
		var settings = MongoClientFactory.settingsBuilder(connection)
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS))
				.applyToSocketSettings(socket -> socket.connectTimeout(TIMEOUT.toMillis(), TimeUnit.MILLISECONDS))
				.build();
		long start = System.nanoTime();
		try (var client = MongoClients.create(settings)) {
			try {
				MongoDatabase database = client.getDatabase(connection.databaseName());
				database.runCommand(new Document("ping", 1));
				// ping works without a login; this does not, so missing credentials fail now, not at the first query.
				database.runCommand(new Document("listCollections", 1).append("nameOnly", true)
						.append("authorizedCollections", true));
			}
			catch (MongoException ex) {
				// Read the cluster state before the client closes: it holds each server's own connection error.
				throw failure(connection, classify(ex, connection, client.getClusterDescription()), ex);
			}
		}
		long millis = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);
		log.info("MongoDB ping ok (" + millis + " ms): " + connection.redacted());
	}

	private static BootstrapPropertyException failure(MongoConnection connection, Failure failure, MongoException ex) {
		// Credentials of a host-style configuration live in spring.mongodb.username/password, not in the host.
		boolean hostStyleLogin = failure.kind() == Kind.AUTHENTICATION
				&& !connection.source().equals(BootstrapProperties.MONGODB_URI);
		String property = hostStyleLogin ? BootstrapProperties.MONGODB_USERNAME : connection.source();
		String help = failure.kind() == Kind.UNREACHABLE ? help(connection.source()) : "";
		return new BootstrapPropertyException(property,
				"Cannot use MongoDB at " + connection.redacted() + ": " + failure.reason() + "." + help, ex);
	}

	static Failure classify(MongoException ex, MongoConnection connection, ClusterDescription cluster) {
		if (ex instanceof MongoSecurityException) {
			return new Failure(Kind.AUTHENTICATION, authenticationFailure(connection));
		}
		if (ex instanceof MongoCommandException command && command.getErrorCode() == UNAUTHORIZED) {
			String user = connection.connectionString().getUsername();
			return new Failure(Kind.AUTHENTICATION, user == null
					? "the server requires a login, but no credentials are configured"
					: "user '" + user + "' is not allowed to list the collections of database '"
							+ connection.databaseName() + "'");
		}
		if (ex instanceof MongoTimeoutException) {
			if (cluster.getSrvResolutionException() != null) {
				return new Failure(Kind.UNREACHABLE, "host not found (SRV lookup failed)");
			}
			if (anyServerFailedWith(cluster, ConnectException.class)) {
				return new Failure(Kind.UNREACHABLE, "connection refused");
			}
			if (anyServerFailedWith(cluster, UnknownHostException.class)) {
				return new Failure(Kind.UNREACHABLE, "host not found");
			}
			return new Failure(Kind.UNREACHABLE, "no server reachable within " + TIMEOUT.toSeconds() + " s");
		}
		return new Failure(Kind.OTHER, ex.getClass().getSimpleName() + ": " + ex.getMessage());
	}

	/** Names the user, or the mechanism when the login has no user name (X.509). */
	static String authenticationFailure(MongoConnection connection) {
		String user = connection.connectionString().getUsername();
		if (user != null) {
			return "authentication failed for user '" + user + "'";
		}
		MongoCredential credential = connection.connectionString().getCredential();
		String mechanism = credential != null ? credential.getMechanism() : null;
		return mechanism != null ? "authentication failed (" + mechanism + ")" : "authentication failed";
	}

	private static boolean anyServerFailedWith(ClusterDescription cluster, Class<? extends Throwable> type) {
		return cluster.getServerDescriptions().stream().map(ServerDescription::getException).filter(Objects::nonNull)
				.anyMatch(failure -> causedBy(failure, type));
	}

	private static boolean causedBy(Throwable failure, Class<? extends Throwable> type) {
		for (Throwable current = failure; current != null; current = current.getCause()) {
			if (type.isInstance(current)) {
				return true;
			}
		}
		return false;
	}

	private static String help(String source) {
		String example = source.equals(BootstrapProperties.MONGODB_URI)
				? "mongodb://user:password@db.example:27017/opencelium" : "db.example";
		return """


				Options:
				  1. Install and start MongoDB on this machine
				     (macOS: brew services start mongodb-community; Linux: systemctl start mongod).
				  2. Point %s at a reachable server, for example %s.
				  3. Start one with Docker: docker run -d --name opencelium-mongo -p 27017:27017 mongo:8"""
				.formatted(source, example);
	}

}
