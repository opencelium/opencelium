package io.opencelium.core.secrets.keys;

import com.mongodb.MongoException;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.model.Projections;

import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.MongoStartupPing;

/**
 * Whether a database holds a wrapped data key, read with the plain driver and a client of its own: the setup wizard
 * asks this before Spring starts, so it has no repository. A database that holds one must keep its root key, so the
 * wizard never offers to generate a new one there.
 */
public final class WrappedDekProbe {

	private WrappedDekProbe() {
	}

	/**
	 * @throws MongoException when the server does not answer within the timeout of the startup ping, or refuses the
	 *                        read
	 */
	public static boolean existsAny(MongoConnection connection) {
		try (MongoClient client = MongoClients.create(MongoStartupPing.checkSettings(connection))) {
			return client.getDatabase(connection.databaseName()).getCollection(WrappedDek.COLLECTION).find()
					.projection(Projections.include("_id")).limit(1).first() != null;
		}
	}

}
