package io.opencelium.core.setup;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * The command line of {@code java -jar oc-app.jar}, split into what the setup understands and what goes to Spring
 * Boot. The setup's own parts are one optional {@link Subcommand}, {@code --answers <file>} (also
 * {@code --answers=<file>}), {@code --non-interactive}, and {@code --help} ({@code -h}, {@code help}). Everything
 * else is passed on unchanged and in its original order, so {@code --server.port=9091} works as it does with Boot
 * alone. Parsed by hand: a handful of flags does not justify a command line library.
 *
 * @param subcommand      the bare word that selects what runs, when one is given
 * @param answersFile     the path behind {@code --answers}, as typed, when the flag is given
 * @param nonInteractive  {@code --non-interactive}: never ask a question
 * @param help            {@code --help}, {@code -h} or {@code help}: print the usage and do nothing else
 * @param springArguments the arguments for Spring Boot, without the setup's own
 */
public record LaunchArguments(Optional<Subcommand> subcommand, Optional<Path> answersFile, boolean nonInteractive,
		boolean help, List<String> springArguments) {

	static final String ANSWERS_FLAG = "--answers";

	static final String NON_INTERACTIVE_FLAG = "--non-interactive";

	private static final List<String> HELP_WORDS = List.of("--help", "-h", "help");

	public LaunchArguments {
		Objects.requireNonNull(subcommand, "subcommand");
		Objects.requireNonNull(answersFile, "answersFile");
		springArguments = List.copyOf(springArguments);
	}

	/**
	 * @throws SetupFailedException with exit code 2 when a bare word is not a known command, or {@code --answers}
	 *                              has no file path
	 */
	public static LaunchArguments parse(String... args) {
		Subcommand subcommand = null;
		Path answersFile = null;
		boolean nonInteractive = false;
		boolean help = false;
		List<String> springArguments = new ArrayList<>();
		for (int i = 0; i < args.length; i++) {
			String arg = args[i];
			if (HELP_WORDS.contains(arg)) {
				help = true;
			}
			else if (arg.equals(NON_INTERACTIVE_FLAG)) {
				nonInteractive = true;
			}
			else if (arg.equals(ANSWERS_FLAG)) {
				// The path is the next argument, unless there is none or it is a flag itself.
				if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
					throw SetupFailedException.usage(ANSWERS_FLAG + " needs the path of the answers file.");
				}
				answersFile = answersPath(args[++i]);
			}
			else if (arg.startsWith(ANSWERS_FLAG + "=")) {
				answersFile = answersPath(arg.substring(ANSWERS_FLAG.length() + 1));
			}
			else if (arg.startsWith("-")) {
				springArguments.add(arg);
			}
			else {
				subcommand = Subcommand.parse(arg)
						.orElseThrow(() -> SetupFailedException.usage("Unknown command '" + arg + "'."));
			}
		}
		return new LaunchArguments(Optional.ofNullable(subcommand), Optional.ofNullable(answersFile), nonInteractive,
				help, springArguments);
	}

	/** Whether the setup wizard was asked for with the {@code setup} command. */
	public boolean isSetup() {
		return subcommand.filter(Subcommand.SETUP::equals).isPresent();
	}

	private static Path answersPath(String value) {
		if (value.isBlank()) {
			throw SetupFailedException.usage(ANSWERS_FLAG + " needs the path of the answers file.");
		}
		try {
			return Path.of(value);
		}
		catch (InvalidPathException ex) {
			throw SetupFailedException.usage("'" + value + "' is not a valid path for " + ANSWERS_FLAG + ".");
		}
	}

}
