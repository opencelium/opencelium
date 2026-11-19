package io.opencelium.core.tenant;

import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.logging.LoggingSystem;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ConfigurableApplicationContext;

import io.opencelium.common.tenant.TenantId;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.testsupport.CoreStartup;
import io.opencelium.core.testsupport.LocalMongo;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Each application log line names the tenant of its work, as {@code java -jar} prints it with the default log
 * pattern. In the self-host mode each line names the 1 tenant of the installation, also a line of the start. In the
 * cloud mode a line names the tenant that the tenant runner binds, and a line without a bound tenant shows {@code -}.
 */
@ExtendWith({OutputCaptureExtension.class, LocalMongo.Cleanup.class})
class TenantLogLineTest {

	/** The starts of this class share 1 database, and with it the key canary: each start gets the same master key. */
	private static final String MASTER_KEY = randomKey();

	/** A line of the default log pattern starts with its time stamp; a banner or a stack trace line does not. */
	private static final Pattern LOG_LINE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}");

	private static final Log log = LogFactory.getLog(TenantLogLineTest.class);

	@TempDir
	Path dataDir;

	/**
	 * Spring Boot configures the log library 1 time while a context is open, and a cached test context of another
	 * class stays open. Thus each start here configures it again, with the log pattern of its own mode.
	 */
	@BeforeEach
	void configureTheLogLibraryAtTheNextStart() {
		LoggingSystem.get(getClass().getClassLoader()).cleanUp();
	}

	@Test
	void startWritesTheTenantIdIntoEachLineWhenTheModeIsSelfHost(CapturedOutput output) {
		start("self-host").close();

		assertThat(logLines(output)).isNotEmpty()
				.allSatisfy(line -> assertThat(line).contains("] [self-host-tenant] "));
	}

	@Test
	void runWritesTheBoundTenantIntoTheLineWhenTheModeIsCloud(CapturedOutput output) {
		try (ConfigurableApplicationContext context = start("cloud")) {
			context.getBean(TenantRunner.class).run(TenantId.of("acme"), () -> log.info("A line of the tenant acme"));
		}

		assertThat(logLines(output)).filteredOn(line -> line.contains("A line of the tenant acme")).singleElement()
				.asString().contains("] [acme] ");
	}

	@Test
	void startWritesNoTenantIdWhenTheModeIsCloud(CapturedOutput output) {
		start("cloud").close();

		assertThat(logLines(output)).isNotEmpty().allSatisfy(line -> assertThat(line).contains("] [-] "));
	}

	private ConfigurableApplicationContext start(String mode) {
		return CoreStartup.run(Map.of("OC_MASTER_KEY", MASTER_KEY), dataDir,
				CoreStartup.arg(OpenCeliumProperties.DEPLOYMENT_MODE, mode),
				CoreStartup.mongoUri(LocalMongo.uriFor(TenantLogLineTest.class)));
	}

	private static List<String> logLines(CapturedOutput output) {
		return output.getOut().lines().filter(line -> LOG_LINE.matcher(line).find()).toList();
	}

	private static String randomKey() {
		byte[] key = new byte[32];
		new SecureRandom().nextBytes(key);
		return Base64.getEncoder().encodeToString(key);
	}

}
