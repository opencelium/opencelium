package io.opencelium.core.setup;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * The command line of {@code java -jar oc-app.jar}, split into what the setup understands and what goes to Spring
 * Boot. The setup's own parts are one optional {@link Subcommand}, {@code --file <path>} (also
 * {@code --file=<path>} and {@code -f <path>}), {@code --template}, {@code --non-interactive}, and {@code --help}
 * ({@code -h}, {@code help}). Everything
 * else is passed on unchanged and in its original order, so {@code --server.port=9091} works as it does with Boot
 * alone. Parsed by hand: a handful of flags does not justify a command line library.
 *
 * @param subcommand      the bare word that selects what runs, when one is given
 * @param setupFile     the path behind {@code --file}, as typed, when the flag is given
 * @param nonInteractive  {@code --non-interactive}: never ask a question
 * @param template        {@code --template}: print the template of the setup file and do nothing else
 * @param help            {@code --help}, {@code -h} or {@code help}: print the usage and do nothing else
 * @param springArguments the arguments for Spring Boot, without the setup's own
 */
public record LaunchArguments(Optional<Subcommand> subcommand, Optional<Path> setupFile, boolean nonInteractive,
		boolean template, boolean help, List<String> springArguments) {

	static final String FILE_FLAG = "--file";

	static final String SHORT_FILE_FLAG = "-f";

	static final String TEMPLATE_FLAG = "--template";

	static final String NON_INTERACTIVE_FLAG = "--non-interactive";

	private static final List<String> HELP_WORDS = List.of("--help", "-h", "help");

	public LaunchArguments {
		Objects.requireNonNull(subcommand, "subcommand");
		Objects.requireNonNull(setupFile, "setupFile");
		springArguments = List.copyOf(springArguments);
	}

	/**
	 * @throws SetupFailedException with exit code 2 when a bare word is not a known command, or {@code --file}
	 *                              has no file path
	 */
	public static LaunchArguments parse(String... args) {
		Subcommand subcommand = null;
		Path setupFile = null;
		boolean nonInteractive = false;
		boolean template = false;
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
			else if (arg.equals(TEMPLATE_FLAG)) {
				template = true;
			}
			else if (arg.equals(FILE_FLAG) || arg.equals(SHORT_FILE_FLAG)) {
				// The path is the next argument, unless there is none or it is a flag itself.
				if (i + 1 >= args.length || args[i + 1].startsWith("-")) {
					throw SetupFailedException.usage(FILE_FLAG + " needs the path of the setup file.");
				}
				setupFile = filePath(args[++i]);
			}
			else if (arg.startsWith(FILE_FLAG + "=")) {
				setupFile = filePath(arg.substring(FILE_FLAG.length() + 1));
			}
			else if (arg.startsWith("-")) {
				springArguments.add(arg);
			}
			else {
				subcommand = Subcommand.parse(arg)
						.orElseThrow(() -> SetupFailedException.usage("Unknown command '" + arg + "'."));
			}
		}
		return new LaunchArguments(Optional.ofNullable(subcommand), Optional.ofNullable(setupFile), nonInteractive,
				template, help, springArguments);
	}

	/** Whether the setup wizard was asked for with the {@code setup} command. */
	public boolean isSetup() {
		return subcommand.filter(Subcommand.SETUP::equals).isPresent();
	}

	private static Path filePath(String value) {
		if (value.isBlank()) {
			throw SetupFailedException.usage(FILE_FLAG + " needs the path of the setup file.");
		}
		try {
			return Path.of(value);
		}
		catch (InvalidPathException ex) {
			throw SetupFailedException.usage("'" + value + "' is not a valid path for " + FILE_FLAG + ".");
		}
	}

}
