package io.opencelium.core;

import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * Starts the application as {@code java -jar oc-app.jar} does with an empty configuration: no deployment mode, no
 * MongoDB URI, no master key. Only the data directory and the database name are set, so the generated key and the
 * written documents stay out of the working tree and of the {@code opencelium} database. The documented default
 * server is {@code localhost:27017}, so the class is skipped when {@code OC_TEST_MONGO_URI} points elsewhere.
 */
@ExtendWith({OutputCaptureExtension.class, LocalMongo.Cleanup.class})
class ZeroConfigStartupTest {

	@TempDir
	Path dataDir;

	@BeforeEach
	void requiresTheDefaultServer() {
		assumeTrue(LocalMongo.isDefaultServer(), "ZeroConfigStartupTest needs the documented default server "
				+ LocalMongo.DEFAULT_SERVER + "; unset " + LocalMongo.SERVER_VARIABLE + " to run it");
	}

	@Test
	void firstStartLogsTheDefaultsThePingAndTheKeySource(CapturedOutput output) {
		start();

		assertThat(output).contains("opencelium.deployment-mode = self-host (default)")
				.contains("spring.mongodb.uri = mongodb://localhost:27017/opencelium (default)")
				.contains("MongoDB ping ok")
				.contains("A new master key was generated: " + dataDir.resolve("master.key"))
				.contains("No stored data keys yet; canary unwrap skipped (key id k-01)")
				// Boot names the launcher's main class here (GradleWorkerMain), CoreApplication under java -jar.
				.containsPattern("Started \\S+ in [0-9.]+ seconds");
	}

	@Test
	void firstStartWritesAnOwnerOnlyKeyFileOf32Bytes() throws Exception {
		start();

		Path file = dataDir.resolve("master.key");
		assertThat(Base64.getDecoder().decode(Files.readString(file).strip())).hasSize(32);
		if (FileSystems.getDefault().supportedFileAttributeViews().contains("posix")) {
			assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(file))).isEqualTo("rw-------");
		}
	}

	@Test
	void secondStartLoadsTheKeyAndGeneratesNothing(CapturedOutput output) {
		start();
		int firstStartEnd = output.toString().length();

		start();

		String secondStart = output.toString().substring(firstStartEnd);
		assertThat(secondStart).contains("Master key loaded from " + dataDir.resolve("master.key") + " (key id k-01)")
				.doesNotContain("A new master key was generated");
	}

	private void start() {
		String database = LocalMongo.databaseFor(ZeroConfigStartupTest.class);
		CoreStartup.run(Map.of(), dataDir, CoreStartup.arg(BootstrapProperties.MONGODB_DATABASE, database)).close();
	}

}
