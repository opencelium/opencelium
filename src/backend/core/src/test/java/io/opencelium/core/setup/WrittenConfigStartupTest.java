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
import io.opencelium.core.config.mongo.MongoStartupPing;
import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.secrets.keys.WrappedDekProbe;
import io.opencelium.core.setup.steps.DataDirStep;
import io.opencelium.core.setup.steps.MasterKeyGuard;
import io.opencelium.core.setup.steps.MasterKeyStep;
import io.opencelium.core.setup.steps.MongoStep;
import io.opencelium.core.setup.steps.PortStep;
import io.opencelium.core.setup.steps.SetupStep;
import io.opencelium.core.setup.steps.SummaryStep;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The files the wizard writes start the application. A scripted run writes them into a temporary working
 * directory; the start then reads that {@code config/} as an additional location, as Boot reads {@code ./config/}
 * next to the jar. The written mode, data directory, port and MongoDB URI bind, so none of them gets a
 * {@code (default)} line. The run takes the local server that the MongoDB step finds on {@code localhost:27017}, so
 * the class is skipped when {@code OC_TEST_MONGO_URI} points elsewhere. The master key step reads the database of
 * this class and an empty environment, not the {@code opencelium} database and the shell of the developer.
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
		// Enter at the MongoDB menu takes the local server, Enter at the master key menu generates a key, Enter at
		// the summary confirms, and y after the write confirms the backup of the master key.
		console.type(dataDir.toString(), String.valueOf(port), "", "", "", "y");
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
				.doesNotContain("spring.mongodb.uri = ").contains("MongoDB ping ok");
		assertThat(workingDir.resolve("config/application.yml")).content().contains("uri: ${OC_MONGO_URI}\n");
		assertThat(workingDir.resolve("config/opencelium.env")).content()
				.contains("\nOC_MONGO_URI=mongodb://localhost:27017/opencelium\n");
		assertThat(dataDir.resolve("master.key")).exists();
		assertThat(output).doesNotContain("A new master key was generated");
	}

	private SetupLauncher launcher() {
		var locations = new ConfigLocations(workingDir, workingDir.resolve("etc/opencelium"));
		return new SetupLauncher(() -> true, Map.of(), new Properties(), locations, steps(locations),
				console, new PrintWriter(new StringWriter(), true), new PrintWriter(new StringWriter(), true));
	}

	/** The standard steps, with a master key step that reads the database of this class and no variable. */
	private List<SetupStep> steps(ConfigLocations locations) {
		Map<String, String> noVariables = Map.of();
		var database = StaticMongoConnectionResolver.parseUri(LocalMongo.uriFor(WrittenConfigStartupTest.class));
		var guard = new MasterKeyGuard(new MongoStartupPing()::check, connection -> WrappedDekProbe.existsAny(database),
				noVariables::get);
		return List.of(new DataDirStep(), new PortStep(), new MongoStep(),
				new MasterKeyStep(guard, noVariables::get, line -> {
				}, workingDir), new SummaryStep(locations));
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
