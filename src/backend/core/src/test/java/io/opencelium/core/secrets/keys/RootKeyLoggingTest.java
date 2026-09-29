package io.opencelium.core.secrets.keys;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;

/** The complete startup output, as {@code java -jar} prints it, never contains the master key. */
@ExtendWith(OutputCaptureExtension.class)
class RootKeyLoggingTest {

	@TempDir
	Path dataDir;

	@AfterAll
	static void dropDatabase() {
		LocalMongo.drop(RootKeyLoggingTest.class);
	}

	@Test
	void startupOutputShowsTheBackupWarningButNeverTheGeneratedKey(CapturedOutput output) throws Exception {
		start(Map.of());

		Path file = dataDir.resolve("master.key");
		String key = Files.readString(file).strip();
		assertThat(output).contains("A new master key was generated: " + file).contains("BACK UP THIS FILE NOW")
				.doesNotContain(key);
	}

	@Test
	void startupOutputNamesTheVariableButNeverTheKeyFromIt(CapturedOutput output) {
		byte[] bytes = new byte[32];
		new SecureRandom().nextBytes(bytes);
		String key = Base64.getEncoder().encodeToString(bytes);

		start(Map.of("OC_MASTER_KEY", key));

		assertThat(output).contains("Master key loaded from environment variable OC_MASTER_KEY (key id k-01)")
				.doesNotContain(key);
		assertThat(dataDir.resolve("master.key")).doesNotExist();
	}

	private void start(Map<String, String> environmentVariables) {
		CoreStartup.run(environmentVariables, "--opencelium.data-dir=" + dataDir,
				"--spring.mongodb.uri=" + LocalMongo.uri(LocalMongo.databaseFor(RootKeyLoggingTest.class))).close();
	}

}
