package io.opencelium.core.config.mongo;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import org.bson.UuidRepresentation;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

/** Creating a client does not connect, so these tests need no running MongoDB. */
class MongoClientFactoryTest {

	private final MongoClientFactory factory = new MongoClientFactory();

	@AfterEach
	void close() {
		factory.close();
	}

	@Test
	void databasesOnTheSameClusterShareOneClient() {
		MongoClient first = factory.clientFor(connection("mongodb://db.example/tenant_a"));
		MongoClient second = factory.clientFor(connection("mongodb://db.example/tenant_b"));

		assertThat(second).isSameAs(first);
	}

	@Test
	void defaultPortAndOptionOrderShareOneClient() {
		MongoClient first = factory.clientFor(connection("mongodb://db.example/a?w=1&retryWrites=false"));
		MongoClient second = factory.clientFor(connection("mongodb://db.example:27017/b?retryWrites=false&w=1"));

		assertThat(second).isSameAs(first);
	}

	@Test
	void differentClustersGetDifferentClients() {
		MongoClient first = factory.clientFor(connection("mongodb://db-1.example/opencelium"));
		MongoClient second = factory.clientFor(connection("mongodb://db-2.example/opencelium"));

		assertThat(second).isNotSameAs(first);
	}

	@Test
	void closeClosesEveryClient() {
		MongoClient first = factory.clientFor(connection("mongodb://db-1.example/opencelium"));
		MongoClient second = factory.clientFor(connection("mongodb://db-2.example/opencelium"));

		factory.close();

		assertThatIllegalStateException().isThrownBy(() -> first.listDatabaseNames().first());
		assertThatIllegalStateException().isThrownBy(() -> second.listDatabaseNames().first());
	}

	@Test
	void defaultsApplyWhenTheUriSaysNothing() {
		MongoClientSettings settings = MongoClientFactory.settingsBuilder(connection("mongodb://db.example/a")).build();

		assertThat(settings.getUuidRepresentation()).isEqualTo(UuidRepresentation.STANDARD);
		assertThat(settings.getApplicationName()).isEqualTo("opencelium-core");
	}

	@Test
	void uriSettingsWinOverTheDefaults() {
		MongoClientSettings settings = MongoClientFactory.settingsBuilder(
				connection("mongodb://db.example/a?uuidRepresentation=javaLegacy&appName=reporting")).build();

		assertThat(settings.getUuidRepresentation()).isEqualTo(UuidRepresentation.JAVA_LEGACY);
		assertThat(settings.getApplicationName()).isEqualTo("reporting");
	}

	private static MongoConnection connection(String uri) {
		var connectionString = new ConnectionString(uri);
		return new MongoConnection(connectionString, connectionString.getDatabase());
	}

}
