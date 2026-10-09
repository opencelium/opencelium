package io.opencelium.core.setup.steps;

import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;

import io.opencelium.core.config.DataDirDefaults;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Where OpenCelium keeps its local state. The default is the one the application uses without a configuration.
 * A path is accepted when it is a writable directory, or when it does not exist and its nearest existing ancestor
 * is a writable directory. The step makes nothing: the application creates the directory at its start.
 */
public final class DataDirStep implements SetupStep {

	private static final String HELP = """
			Where OpenCelium keeps its local state: the master key, downloads, and a MongoDB that the setup installs.
			On Linux the usual place is /var/lib/opencelium. The directory must be writable by the user that runs
			OpenCelium; it is made at the first start.""";

	private final Path defaultDir;

	public DataDirStep() {
		this(DataDirDefaults.forThisHost().resolve());
	}

	DataDirStep(Path defaultDir) {
		this.defaultDir = Objects.requireNonNull(defaultDir, "defaultDir");
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		String answer = prompter.text("Data directory", HELP, defaultDir.toString(), DataDirStep::check);
		context.setDataDir(absolute(answer));
	}

	/** The problem with {@code value} as a data directory, or empty when it is acceptable. */
	static Optional<String> check(String value) {
		Path dir;
		try {
			dir = absolute(value);
		}
		catch (InvalidPathException ex) {
			return Optional.of("'" + value + "' is not a valid path: " + ex.getReason() + ".");
		}
		if (Files.exists(dir)) {
			if (!Files.isDirectory(dir)) {
				return Optional.of(dir + " is a file, not a directory.");
			}
			return Files.isWritable(dir) ? Optional.empty() : Optional.of(dir + " is not writable by this user.");
		}
		Path ancestor = dir.getParent();
		while (ancestor != null && !Files.exists(ancestor)) {
			ancestor = ancestor.getParent();
		}
		if (ancestor == null) {
			return Optional.of(dir + " cannot be created.");
		}
		if (!Files.isDirectory(ancestor)) {
			return Optional.of(dir + " cannot be created: " + ancestor + " is a file.");
		}
		if (!Files.isWritable(ancestor)) {
			return Optional.of(dir + " cannot be created: " + ancestor + " is not writable by this user.");
		}
		return Optional.empty();
	}

	private static Path absolute(String value) {
		return Path.of(value).toAbsolutePath().normalize();
	}

}
