package io.opencelium.core.user;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.bson.Document;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.mongo.MongoConnection;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The question "an admin exists" of the setup wizard, against the local MongoDB and without a Spring context,
 * because the wizard asks it before Spring starts. The documents have the form that the user service stores.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class AdminLookupTest {

	private static final String URI = LocalMongo.uriFor(AdminLookupTest.class);

	private static final MongoConnection CONNECTION = StaticMongoConnectionResolver.parseUri(URI);

	@BeforeEach
	void emptyUsersCollection() {
		try (MongoClient client = client()) {
			users(client).drop();
		}
	}

	@Test
	void existsReturnsTrueWhenAdminIsStored() {
		storeUser("self-host", "admin", UserService.ADMIN_ROLE);

		assertThat(AdminLookup.exists(CONNECTION, TenantId.SELF_HOST)).isTrue();
	}

	@Test
	void existsReturnsFalseWhenNoAdminIsStored() {
		// A user without the admin role, and an admin of another tenant: neither is the admin of this tenant.
		storeUser("self-host", "viewer", "VIEWER");
		storeUser("other", "admin", UserService.ADMIN_ROLE);

		assertThat(AdminLookup.exists(CONNECTION, TenantId.SELF_HOST)).isFalse();
	}

	private static void storeUser(String tenant, String username, String role) {
		try (MongoClient client = client()) {
			users(client).insertOne(new Document("tenantId", tenant).append("username", username)
					.append("roles", List.of(role)));
		}
	}

	/** Gives up after 5 s when the server is gone, as the setup ping does. */
	private static MongoClient client() {
		return MongoClients.create(MongoClientSettings.builder().applyConnectionString(new ConnectionString(URI))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build());
	}

	private static MongoCollection<Document> users(MongoClient client) {
		return client.getDatabase(LocalMongo.databaseFor(AdminLookupTest.class)).getCollection("users");
	}

}
