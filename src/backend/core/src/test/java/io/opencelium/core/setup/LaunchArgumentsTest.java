package io.opencelium.core.setup;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The command line of {@code java -jar oc-app.jar}: at most one subcommand, the wizard's own flags, and everything
 * else, which goes to Spring Boot unchanged and in its original order.
 */
class LaunchArgumentsTest {

	@Test
	void parseReadsSetupSubcommand() {
		LaunchArguments arguments = LaunchArguments.parse("setup");

		assertThat(arguments.subcommand()).contains(Subcommand.SETUP);
		assertThat(arguments.springArguments()).isEmpty();
	}

	@Test
	void parseReturnsNoSubcommandWhenNoneIsGiven() {
		assertThat(LaunchArguments.parse("--server.port=9090").subcommand()).isEmpty();
	}

	@Test
	void parseThrowsUsageErrorWhenCommandIsUnknown() {
		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> LaunchArguments.parse("install-service"))
				.withMessageContaining("Unknown command 'install-service'")
				.satisfies(failure -> assertThat(failure.exitCode()).isEqualTo(2));
	}

	@Test
	void parseReadsFilePathInAllSpellings() {
		assertThat(LaunchArguments.parse("setup", "--file", "setup-values.yml").setupFile())
				.contains(Path.of("setup-values.yml"));
		assertThat(LaunchArguments.parse("setup", "--file=setup-values.yml").setupFile())
				.contains(Path.of("setup-values.yml"));
		assertThat(LaunchArguments.parse("setup", "-f", "setup-values.yml").setupFile())
				.contains(Path.of("setup-values.yml"));
	}

	@Test
	void parseReadsTemplateFlag() {
		assertThat(LaunchArguments.parse("setup", "--template").template()).isTrue();
		assertThat(LaunchArguments.parse("setup").template()).isFalse();
	}

	@Test
	void parseLeavesFileEmptyWhenFlagIsAbsent() {
		assertThat(LaunchArguments.parse("setup").setupFile()).isEmpty();
	}

	@Test
	void parseThrowsUsageErrorWhenFileFlagHasNoPath() {
		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> LaunchArguments.parse("setup", "--file"))
				.withMessageContaining("--file")
				.satisfies(failure -> assertThat(failure.exitCode()).isEqualTo(2));
		// The next option is not a path.
		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> LaunchArguments.parse("setup", "--file", "--non-interactive"))
				.withMessageContaining("--file");
		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> LaunchArguments.parse("setup", "-f"))
				.withMessageContaining("--file");
	}

	@Test
	void parseReadsNonInteractiveFlag() {
		assertThat(LaunchArguments.parse("--non-interactive").nonInteractive()).isTrue();
		assertThat(LaunchArguments.parse("setup").nonInteractive()).isFalse();
	}

	@Test
	void parseReadsHelpInAllThreeSpellings() {
		assertThat(LaunchArguments.parse("--help").help()).isTrue();
		assertThat(LaunchArguments.parse("-h").help()).isTrue();
		assertThat(LaunchArguments.parse("help").help()).isTrue();
		assertThat(LaunchArguments.parse("setup").help()).isFalse();
	}

	@Test
	void parseKeepsSpringArgumentsInOrderAndStripsTheWizardOnes() {
		LaunchArguments arguments = LaunchArguments.parse("--server.port=9091", "setup", "--non-interactive",
				"--spring.mongodb.uri=mongodb://db.example/oc", "--file", "a.yml", "--logging.level.root=INFO");

		assertThat(arguments.springArguments()).containsExactly("--server.port=9091",
				"--spring.mongodb.uri=mongodb://db.example/oc", "--logging.level.root=INFO");
	}

}
