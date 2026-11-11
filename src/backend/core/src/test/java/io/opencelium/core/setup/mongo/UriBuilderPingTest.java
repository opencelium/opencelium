package io.opencelium.core.setup.mongo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerAddress;
import com.mongodb.client.MongoClients;
import org.bson.Document;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The built URI against a real server: a database user whose database password has each special character logs in
 * with the URI that the builder makes. The test makes that database user in the {@code admin} database of the local
 * MongoDB and drops it again. It uses no Spring context, because the setup pings before Spring starts. The test
 * runs only against the documented default test server: it makes a database user there, and the built URI has only
 * the host and the port of the server, without the login and the options of another test server.
 */
@ExtendWith(LocalMongo.Cleanup.class)
class UriBuilderPingTest {

	/** Each character that the builder writes in percent-encoding, and the plus sign, which stays as typed. */
	private static final String DATABASE_PASSWORD = "p@ss+w rd:/?#[]%${x}";

	private static final String AUTH_SOURCE = "admin";

	private final String database = LocalMongo.databaseFor(UriBuilderPingTest.class);

	private final String databaseUsername = "oc_test_uribuilder_" + UUID.randomUUID().toString().substring(0, 6);

	@BeforeAll
	static void requiresTheDefaultServer() {
		assumeTrue(LocalMongo.isDefaultServer(), "UriBuilderPingTest needs the documented default server "
				+ LocalMongo.DEFAULT_SERVER + "; unset " + LocalMongo.SERVER_VARIABLE + " to run it");
	}

	@BeforeEach
	void makeTheDatabaseUser() {
		runInAdmin(new Document("createUser", databaseUsername).append("pwd", DATABASE_PASSWORD)
				.append("roles", List.of(new Document("role", "readWrite").append("db", database))));
	}

	@AfterEach
	void dropTheDatabaseUser() {
		runInAdmin(new Document("dropUser", databaseUsername));
	}

	@Test
	void pingSucceedsWhenTheDatabasePasswordHasEachSpecialCharacter() {
		ServerAddress server = new ServerAddress(new ConnectionString(LocalMongo.uri(database)).getHosts().getFirst());
		String port = String.valueOf(server.getPort());

		String uri = UriBuilder.build(server.getHost(), port, database, databaseUsername, DATABASE_PASSWORD,
				AUTH_SOURCE);

		assertThat(ping(uri)).isEmpty();
		// The server checks the database login: the same database user with another database password stays out.
		String wrong = UriBuilder.build(server.getHost(), port, database, databaseUsername, DATABASE_PASSWORD + "x",
				AUTH_SOURCE);
		assertThat(ping(wrong)).contains("authentication failed for user '" + databaseUsername + "'");
	}

	/** The cause why the start ping cannot use MongoDB at {@code uri}; empty when the database login succeeds. */
	private static Optional<String> ping(String uri) {
		return new MongoStartupPing().check(StaticMongoConnectionResolver.parseUri(uri));
	}

	/** Runs a user command with the login of the test server; gives up after 5 s when the server is gone. */
	private static void runInAdmin(Document command) {
		var settings = MongoClientSettings.builder()
				.applyConnectionString(new ConnectionString(LocalMongo.uri(AUTH_SOURCE)))
				.applyToClusterSettings(cluster -> cluster.serverSelectionTimeout(5, TimeUnit.SECONDS)).build();
		try (var client = MongoClients.create(settings)) {
			client.getDatabase(AUTH_SOURCE).runCommand(command);
		}
	}

}
