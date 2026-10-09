package io.opencelium.core.setup;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.ServerSocket;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.Properties;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ConfigurableApplicationContext;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The files the wizard writes start the application. A scripted run writes them into a temporary working
 * directory; the start then reads that {@code config/} as an additional location, as Boot reads {@code ./config/}
 * next to the jar. The written mode, data directory and port bind; the mode and the data directory get no
 * {@code (default)} line, the MongoDB URI still gets its one, because the wizard does not write it. That default is
 * {@code localhost:27017}, so the class is skipped when {@code OC_TEST_MONGO_URI} points elsewhere.
 */
@ExtendWith({OutputCaptureExtension.class, LocalMongo.Cleanup.class})
class WrittenConfigStartupTest {

	@TempDir
	Path workingDir;

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	@BeforeEach
	void requiresTheDefaultServer() {
		assumeTrue(LocalMongo.isDefaultServer(), "WrittenConfigStartupTest needs the documented default server "
				+ LocalMongo.DEFAULT_SERVER + "; unset " + LocalMongo.SERVER_VARIABLE + " to run it");
	}

	@Test
	void applicationStartsOnTheWrittenFiles(CapturedOutput output) throws IOException {
		Path dataDir = workingDir.resolve("data");
		int port = freePort();
		console.type(dataDir.toString(), String.valueOf(port), "");
		var started = new AtomicReference<ConfigurableApplicationContext>();

		OptionalInt exitCode = launcher().launch(new String[0], springArgs -> started.set(boot(springArgs)));

		assertThat(exitCode).isEmpty();
		try (ConfigurableApplicationContext context = started.get()) {
			assertThat(context).isNotNull();
			OpenCeliumProperties properties = context.getBean(OpenCeliumProperties.class);
			assertThat(properties.deploymentMode()).isEqualTo(DeploymentMode.SELF_HOST);
			assertThat(properties.dataDir()).isEqualTo(dataDir);
			assertThat(context.getEnvironment().getProperty("server.port", Integer.class)).isEqualTo(port);
		}
		assertThat(output).doesNotContain("opencelium.deployment-mode = ").doesNotContain("opencelium.data-dir = ")
				.contains("spring.mongodb.uri = mongodb://localhost:27017/opencelium (default)")
				.contains("MongoDB ping ok");
		assertThat(workingDir.resolve("config/application.yml")).exists();
		assertThat(workingDir.resolve("config/opencelium.env")).exists();
	}

	private SetupLauncher launcher() {
		var locations = new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium"));
		return new SetupLauncher(() -> true, Map.of(), new Properties(), locations, console,
				new PrintWriter(new StringWriter(), true), new PrintWriter(new StringWriter(), true));
	}

	/** Starts as the launcher would, plus the written directory as a location and the per-class database. */
	private ConfigurableApplicationContext boot(String[] springArgs) {
		List<String> args = new ArrayList<>(List.of(springArgs));
		args.add("--spring.config.additional-location=file:" + workingDir.resolve("config") + "/");
		args.add(CoreStartup.arg(BootstrapProperties.MONGODB_DATABASE,
				LocalMongo.databaseFor(WrittenConfigStartupTest.class)));
		return CoreStartup.run(Map.of(), args.toArray(String[]::new));
	}

	private static int freePort() throws IOException {
		try (ServerSocket socket = new ServerSocket(0)) {
			return socket.getLocalPort();
		}
	}

}
