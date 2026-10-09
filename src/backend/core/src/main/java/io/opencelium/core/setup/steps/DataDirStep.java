package io.opencelium.core.setup.steps;

import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;

import io.opencelium.core.config.DataDirDefaults;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Where OpenCelium keeps its local state. The default is the one the application uses without a configuration,
 * shown with {@code ~} for the home directory; a typed {@code ~} is expanded the same way. A path is accepted when
 * it is a writable directory, or when it does not exist and its nearest existing ancestor is a writable directory.
 * The step makes nothing: the application creates the directory at its start.
 */
public final class DataDirStep implements SetupStep {

	private static final String HELP = """
			Where OpenCelium keeps its local state: the master key, downloads, and a MongoDB that the setup installs.
			On Linux the usual place is /var/lib/opencelium. The directory must be writable by the user that runs
			OpenCelium; it is made at the first start.""";

	private static final String HOME = "~";

	private final Path defaultDir;

	private final Path home;

	public DataDirStep() {
		this(DataDirDefaults.forThisHost().resolve(), Path.of(System.getProperty("user.home")));
	}

	DataDirStep(Path defaultDir, Path home) {
		this.defaultDir = Objects.requireNonNull(defaultDir, "defaultDir");
		this.home = Objects.requireNonNull(home, "home").toAbsolutePath().normalize();
	}

	@Override
	public Optional<Question> question() {
		return Optional.of(new Question(ValueKey.DATA_DIR, "Data directory", HELP, abbreviated(defaultDir)));
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		String value = context.values().text(question().orElseThrow(), this::check, prompter);
		context.setDataDir(absolute(expanded(value)));
	}

	/** The problem with {@code value} as a data directory, or empty when it is acceptable. */
	Optional<String> check(String value) {
		Path dir;
		try {
			dir = absolute(expanded(value));
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

	/** {@code ~/oc/data} for a path under the home directory, else the path as it is. */
	private String abbreviated(Path dir) {
		if (dir.equals(home)) {
			return HOME;
		}
		return dir.startsWith(home) ? HOME + "/" + home.relativize(dir) : dir.toString();
	}

	/** The home directory for {@code ~} and {@code ~/...}; any other value as it is. */
	private String expanded(String value) {
		if (value.equals(HOME)) {
			return home.toString();
		}
		return value.startsWith(HOME + "/") ? home.resolve(value.substring(2)).toString() : value;
	}

	private static Path absolute(String value) {
		return Path.of(value).toAbsolutePath().normalize();
	}

}
