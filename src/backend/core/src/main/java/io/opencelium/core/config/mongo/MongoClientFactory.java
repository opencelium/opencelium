package io.opencelium.core.config.mongo;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.UuidRepresentation;

/**
 * Hands out one {@link MongoClient} per cluster, so tenants whose databases share a server and login share one
 * connection pool. Owns the clients and closes them on shutdown.
 */
public final class MongoClientFactory implements AutoCloseable {

	private final Map<MongoClientSettings, MongoClient> clients = new ConcurrentHashMap<>();

	public MongoClient clientFor(MongoConnection connection) {
		return clients.computeIfAbsent(connection.clusterKey(), key -> MongoClients.create(settings(connection)));
	}

	/**
	 * The URI wins where it says something; otherwise our defaults apply: UUIDs in the standard binary format (new
	 * data, no legacy readers to stay compatible with) and the application name {@code opencelium-core}, which shows
	 * in the server's connection list.
	 */
	static MongoClientSettings.Builder settingsBuilder(MongoConnection connection) {
		var builder = MongoClientSettings.builder().applyConnectionString(connection.connectionString());
		if (connection.connectionString().getUuidRepresentation() == null) {
			builder.uuidRepresentation(UuidRepresentation.STANDARD);
		}
		if (connection.connectionString().getApplicationName() == null) {
			builder.applicationName("opencelium-core");
		}
		return builder;
	}

	private static MongoClientSettings settings(MongoConnection connection) {
		return settingsBuilder(connection).build();
	}

	@Override
	public void close() {
		clients.values().forEach(MongoClient::close);
		clients.clear();
	}

}
