package io.opencelium.core.secrets.keys;

import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Starts the real application in cloud mode, as {@code java -jar} would, and checks what a missing key does. */
@ExtendWith({OutputCaptureExtension.class, LocalMongo.Cleanup.class})
class RootKeyStartupFailureTest {

	@TempDir
	Path dataDir;

	@Test
	void cloudModeWithoutAKeyStopsStartupAndGeneratesNothing(CapturedOutput output) {
		assertThatThrownBy(() -> start(Map.of()));

		assertThat(output).contains("APPLICATION FAILED TO START").contains("In cloud mode no key is generated")
				.contains("Property: opencelium.master-key-file").doesNotContain("A new master key was generated");
		assertThat(dataDir.resolve(RootKeyResolver.DATA_DIR_FILE_NAME)).doesNotExist();
	}

	@Test
	void cloudModeWithTheVariableSetStarts(CapturedOutput output) {
		String key = randomKey();

		start(Map.of(RootKeyResolver.ENV_VARIABLE, key));

		assertThat(output).contains("Master key loaded from environment variable OC_MASTER_KEY (key id k-01)")
				.doesNotContain(key);
		assertThat(dataDir.resolve(RootKeyResolver.DATA_DIR_FILE_NAME)).doesNotExist();
	}

	private void start(Map<String, String> environmentVariables) {
		CoreStartup.run(environmentVariables, dataDir, CoreStartup.arg(OpenCeliumProperties.DEPLOYMENT_MODE, "cloud"),
				CoreStartup.mongoUri(LocalMongo.uriFor(RootKeyStartupFailureTest.class))).close();
	}

	private static String randomKey() {
		byte[] key = new byte[32];
		new SecureRandom().nextBytes(key);
		return Base64.getEncoder().encodeToString(key);
	}

}
