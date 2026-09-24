package io.opencelium.core.config.mongo;

import java.time.Duration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoCommandException;
import com.mongodb.ServerAddress;
import org.bson.BsonDocument;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.config.BootstrapPropertyException;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

/** Uses the local MongoDB from {@code OC_TEST_MONGO_URI} (default {@code mongodb://localhost:27017}). */
@ExtendWith(OutputCaptureExtension.class)
class MongoStartupPingTest {

	private final MongoStartupPing ping = new MongoStartupPing();

	@Test
	void reachableServerPassesAndLogsTheRoundTrip(CapturedOutput output) {
		assertThatNoException().isThrownBy(() -> ping.verify(connection(LocalMongo.uri("oc_test_ping"))));

		assertThat(output).containsPattern("MongoDB ping ok \\(\\d+ ms\\): mongodb://.*/oc_test_ping");
	}

	@Test
	void refusedConnectionStopsWithinTheShortTimeout() {
		assertTimeoutPreemptively(Duration.ofSeconds(10), () -> assertThatExceptionOfType(BootstrapPropertyException.class)
				.isThrownBy(() -> ping.verify(connection("mongodb://localhost:1/opencelium")))
				.withMessageContaining("connection refused")
				.withMessageContaining("brew services start mongodb-community")
				.withMessageContaining("docker run")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.uri")));
	}

	@Test
	void hostStyleConfigurationIsNamedInTheError() {
		var hostStyle = new MongoConnection(new ConnectionString("mongodb://localhost:1/opencelium"), "opencelium",
				"spring.mongodb.host");

		assertTimeoutPreemptively(Duration.ofSeconds(10), () -> assertThatExceptionOfType(BootstrapPropertyException.class)
				.isThrownBy(() -> ping.verify(hostStyle))
				.withMessageContaining("Point spring.mongodb.host at a reachable server")
				.satisfies(failure -> assertThat(failure.propertyName()).isEqualTo("spring.mongodb.host")));
	}

	@Test
	void srvLookupFailureIsReportedAsSuch() {
		assertTimeoutPreemptively(Duration.ofSeconds(10), () -> assertThatExceptionOfType(BootstrapPropertyException.class)
				.isThrownBy(() -> ping.verify(connection("mongodb+srv://cluster0.no-such-host.invalid/opencelium")))
				.withMessageContaining("host not found (SRV lookup failed)"));
	}

	@Test
	void unknownHostIsReportedAsSuch() {
		assertTimeoutPreemptively(Duration.ofSeconds(10), () -> assertThatExceptionOfType(BootstrapPropertyException.class)
				.isThrownBy(() -> ping.verify(connection("mongodb://no-such-host.invalid/opencelium")))
				.withMessageContaining("host not found"));
	}

	@Test
	void wrongCredentialsAreReportedWithoutThePassword() {
		String uri = LocalMongo.uriWithLogin("oc_nobody", "wrong-password", "opencelium");

		assertThatExceptionOfType(BootstrapPropertyException.class).isThrownBy(() -> ping.verify(connection(uri)))
				.withMessageContaining("authentication failed for user 'oc_nobody'")
				.withMessageNotContaining("wrong-password")
				// Installing MongoDB does not help with a wrong login.
				.withMessageNotContaining("docker run");
	}

	@Test
	void missingLoginOnAServerThatRequiresOneIsAnAuthenticationFailure() {
		var unauthorized = new MongoCommandException(BsonDocument.parse(
				"{ok: 0, code: 13, errmsg: 'command listCollections requires authentication'}"), new ServerAddress());

		MongoStartupPing.Failure failure = MongoStartupPing.classify(unauthorized,
				connection("mongodb://db.example/opencelium"), null);

		assertThat(failure.kind()).isEqualTo(MongoStartupPing.Kind.AUTHENTICATION);
		assertThat(failure.reason()).isEqualTo("the server requires a login, but no credentials are configured");
	}

	@Test
	void authenticationFailureWithoutUserNamesTheMechanism() {
		var x509 = connection("mongodb://db.example/opencelium?authMechanism=MONGODB-X509&tls=true");

		assertThat(MongoStartupPing.authenticationFailure(x509)).isEqualTo("authentication failed (MONGODB-X509)");
	}

	private static MongoConnection connection(String uri) {
		var connectionString = new ConnectionString(uri);
		return new MongoConnection(connectionString, connectionString.getDatabase() != null
				? connectionString.getDatabase() : "opencelium");
	}

}
