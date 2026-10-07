package io.opencelium.core.config.mongo;

import java.nio.file.Path;
import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

/** Starts the real application, as {@code java -jar} would, and checks the failure report. */
@ExtendWith(OutputCaptureExtension.class)
class MongoStartupFailureTest {

	@TempDir
	Path dataDir;

	@Test
	void unreachableMongoStopsStartupWithinTenSeconds(CapturedOutput output) {
		assertTimeoutPreemptively(Duration.ofSeconds(10),
				() -> assertThatThrownBy(() -> start(CoreStartup.mongoUri("mongodb://localhost:1/opencelium"))));

		assertThat(output).contains("APPLICATION FAILED TO START").contains("connection refused")
				.contains("Property: spring.mongodb.uri");
	}

	@Test
	void saasModeWithoutUriStopsStartup(CapturedOutput output) {
		assertThatThrownBy(() -> start("--opencelium.deployment-mode=saas"));

		assertThat(output).contains("saas mode requires the system database URI explicitly")
				.contains("Property: spring.mongodb.uri");
	}

	@Test
	void uriWithIgnoredCredentialPropertyStopsStartup(CapturedOutput output) {
		assertThatThrownBy(() -> start(CoreStartup.mongoUri(LocalMongo.uri("opencelium")),
				"--spring.mongodb.username=oc"));

		assertThat(output).contains("Boot ignores it").contains("Property: spring.mongodb.username")
				.contains("Remove spring.mongodb.username, or remove spring.mongodb.uri");
	}

	@Test
	void invalidUriWithUnencodedPasswordNeverShowsIt(CapturedOutput output) {
		assertThatThrownBy(() -> start(CoreStartup.mongoUri("mongodb://oc:p@ss%zz@db.example/opencelium")));

		assertThat(output).contains("is not a valid MongoDB connection string").contains("URL-encode")
				.doesNotContain("p@ss").doesNotContain("ss%zz");
	}

	@Test
	void passwordNeverAppearsInTheOutput(CapturedOutput output) {
		String uri = LocalMongo.uriWithLogin("oc_nobody", "wrong-password", "opencelium");

		assertThatThrownBy(() -> start(CoreStartup.mongoUri(uri)));

		assertThat(output).contains("authentication failed").doesNotContain("wrong-password");
	}

	private void start(String... args) {
		CoreStartup.run(Map.of(), dataDir, args).close();
	}

}
