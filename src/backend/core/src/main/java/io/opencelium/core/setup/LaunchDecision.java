package io.opencelium.core.setup;

import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * What {@code main()} does: print the usage, start Spring Boot, or run the setup wizard. Carries the reason in
 * words, so the terminal can say why the wizard did or did not start, and the arguments Spring Boot gets. Those
 * can differ from the command line: the setup's own arguments are removed, and a configuration file in the system
 * directory is added as a location.
 *
 * @param kind            what runs
 * @param reason          why, in words for the terminal, for example "no configuration was found"
 * @param nonInteractive  for the wizard: ask nothing, because of {@code --non-interactive} or a missing terminal
 * @param setupFile     for the wizard: the setup file behind {@code --file}, when one was given
 * @param springArguments the arguments for Spring Boot
 */
public record LaunchDecision(Kind kind, String reason, boolean nonInteractive, Optional<Path> setupFile,
		List<String> springArguments) {

	public enum Kind {

		/** Print the usage text and end with exit code 0. */
		HELP,

		/** Start Spring Boot as if the setup did not exist. */
		BOOT,

		/** Run the setup wizard. */
		WIZARD

	}

	public LaunchDecision {
		Objects.requireNonNull(kind, "kind");
		Objects.requireNonNull(reason, "reason");
		Objects.requireNonNull(setupFile, "setupFile");
		springArguments = List.copyOf(springArguments);
	}

}
