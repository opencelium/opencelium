package io.opencelium.core.config.mongo;

import java.nio.file.Path;
import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.CoreApplication;
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
				() -> assertThatThrownBy(() -> start("--spring.mongodb.uri=mongodb://localhost:1/opencelium")));

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
		assertThatThrownBy(() -> start("--spring.mongodb.uri=" + LocalMongo.uri("opencelium"),
				"--spring.mongodb.username=oc"));

		assertThat(output).contains("Boot ignores it").contains("Property: spring.mongodb.username")
				.contains("Remove spring.mongodb.username, or remove spring.mongodb.uri");
	}

	@Test
	void invalidUriWithUnencodedPasswordNeverShowsIt(CapturedOutput output) {
		assertThatThrownBy(() -> start("--spring.mongodb.uri=mongodb://oc:p@ss%zz@db.example/opencelium"));

		assertThat(output).contains("is not a valid MongoDB connection string").contains("URL-encode")
				.doesNotContain("p@ss").doesNotContain("ss%zz");
	}

	@Test
	void passwordNeverAppearsInTheOutput(CapturedOutput output) {
		String uri = LocalMongo.uriWithLogin("oc_nobody", "wrong-password", "opencelium");

		assertThatThrownBy(() -> start("--spring.mongodb.uri=" + uri));

		assertThat(output).contains("authentication failed").doesNotContain("wrong-password");
	}

	private void start(String... args) {
		String[] all = new String[args.length + 2];
		all[0] = "--spring.main.web-application-type=none";
		all[1] = "--opencelium.data-dir=" + dataDir;
		System.arraycopy(args, 0, all, 2, args.length);
		SpringApplication.run(CoreApplication.class, all).close();
	}

}
