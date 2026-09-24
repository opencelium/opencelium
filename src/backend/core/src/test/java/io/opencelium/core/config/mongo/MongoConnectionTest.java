package io.opencelium.core.config.mongo;

import com.mongodb.ConnectionString;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class MongoConnectionTest {

	@Test
	void redactedHidesThePassword() {
		var connection = connection("mongodb://oc:s3cret@db.example:27017/opencelium?authSource=admin");

		assertThat(connection.redacted()).isEqualTo("mongodb://oc:****@db.example:27017/opencelium?authSource=admin");
	}

	@Test
	void redactedMasksSecretOptionValues() {
		var connection = connection("mongodb://db.example/x?authMechanism=MONGODB-AWS"
				+ "&authMechanismProperties=AWS_SESSION_TOKEN:tok123&proxyHost=p&proxyUsername=u&proxyPassword=pp456&appName=a");

		assertThat(connection.redacted()).isEqualTo("mongodb://db.example/x?authMechanism=MONGODB-AWS"
				+ "&authMechanismProperties=****&proxyHost=p&proxyUsername=u&proxyPassword=****&appName=a");
	}

	@Test
	void redactedMasksAPasswordTheDriverMisreadAsHostAndPort() {
		// Unencoded '/': the driver reads host "oc", port 1234, database "abc@db" and no credentials.
		var misread = new MongoConnection(new ConnectionString("mongodb://oc:1234/abc@db.example/x"), "x");

		assertThat(misread.redacted()).doesNotContain("1234").doesNotContain("abc");
	}

	@Test
	void toStringNeverShowsThePassword() {
		var connection = connection("mongodb://oc:s3cret@db.example:27017/opencelium");

		assertThat(connection.toString()).doesNotContain("s3cret").contains("oc:****@db.example")
				.contains("source=spring.mongodb.uri");
		assertThat(connection.clusterKey().toString()).doesNotContain("s3cret");
	}

	@Test
	void maskUnparsedHidesEverythingUpToTheLastAtSign() {
		assertThat(MongoConnection.maskUnparsed("mongodb://oc:p@ss@db.example/x")).isEqualTo("mongodb://****@db.example/x");
		assertThat(MongoConnection.maskUnparsed("mongodb+srv://oc:s3cret@cluster.example/opencelium"))
				.isEqualTo("mongodb+srv://****@cluster.example/opencelium");
		assertThat(MongoConnection.maskUnparsed("mongodb://:s3cret@db.example/x")).isEqualTo("mongodb://****@db.example/x");
	}

	@Test
	void maskUnparsedCopesWithBrokenPrefixes() {
		for (String input : new String[] { "oc:s3cret@db.example/x", " mongodb://oc:s3cret@db.example/x",
				"mongodb:/oc:s3cret@db.example/x", "mongodb-srv://oc:s3cret@db.example/x", "jdbc:mongodb://oc:s3cret@db/x" }) {
			assertThat(MongoConnection.maskUnparsed(input)).as(input).doesNotContain("s3cret");
		}
	}

	@Test
	void maskUnparsedHidesSecretOptionsEvenWithAnAtSignInTheValue() {
		assertThat(MongoConnection.maskUnparsed("mongodb://db.example/x?proxyPassword=a@b&w=%zz"))
				.isEqualTo("mongodb://db.example/x?proxyPassword=****&w=%zz");
	}

	@Test
	void redactedLeavesAnAtSignInTheOptionsAlone() {
		assertThat(connection("mongodb://db.example:27017/x?appName=me@home").redacted())
				.isEqualTo("mongodb://db.example:27017/x?appName=me@home");
	}

	@Test
	void redactedKeepsUrisWithoutPassword() {
		assertThat(connection("mongodb://localhost:27017/opencelium").redacted())
				.isEqualTo("mongodb://localhost:27017/opencelium");
	}

	@Test
	void databasesOnTheSameClusterShareTheClusterKey() {
		assertThat(connection("mongodb://oc:pw@db.example/a?authSource=admin").clusterKey())
				.isEqualTo(connection("mongodb://oc:pw@db.example/b?authSource=admin").clusterKey());
	}

	@Test
	void defaultPortAndOptionOrderDoNotChangeTheClusterKey() {
		assertThat(connection("mongodb://db.example/a").clusterKey())
				.isEqualTo(connection("mongodb://db.example:27017/a").clusterKey());
		assertThat(connection("mongodb://db.example/a?w=1&retryWrites=false").clusterKey())
				.isEqualTo(connection("mongodb://db.example/a?retryWrites=false&w=1").clusterKey());
	}

	@Test
	void differentHostsCredentialsOrAuthSourcesGiveDifferentClusterKeys() {
		var base = connection("mongodb://oc:pw@db.example/a?authSource=admin").clusterKey();

		assertThat(connection("mongodb://oc:pw@other.example/a?authSource=admin").clusterKey()).isNotEqualTo(base);
		assertThat(connection("mongodb://oc:other@db.example/a?authSource=admin").clusterKey()).isNotEqualTo(base);
		// Without authSource the database path is the credential source, so these are different logins.
		assertThat(connection("mongodb://oc:pw@db.example/a").clusterKey())
				.isNotEqualTo(connection("mongodb://oc:pw@db.example/b").clusterKey());
	}

	private static MongoConnection connection(String uri) {
		var connectionString = new ConnectionString(uri);
		return new MongoConnection(connectionString, "x");
	}

}
