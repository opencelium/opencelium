package io.opencelium.core.setup.steps;

import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.UnaryOperator;

import io.opencelium.core.secrets.keys.RootKeyGenerator;
import io.opencelium.core.secrets.keys.RootKeyResolver;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.SetupActionException;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.prompt.Choice;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;

/**
 * Where the master key comes from. The master key is the root of the encryption of the stored credentials, so the
 * step first says why it matters, then offers to generate a new key into the data directory, to use the variable
 * {@code OC_MASTER_KEY}, or to read a key file. A key that the data directory holds already is kept, never
 * replaced: a new key could not read what the old one encrypted. Before the menu the guard makes sure that the
 * database holds no encrypted data keys without their key; when it holds some, the step generates no key. When
 * {@code OC_MASTER_KEY} is set in the environment of the setup, the step takes it without a menu: the start in this
 * process reads the variable first, so another answer would not be the key that the start uses.
 * <p>
 * The step writes nothing. A generated key is an action of the plan: it makes the key file after the other files are
 * written, never in the place of a file that exists, and then asks whether the user backed it up, because the file
 * must exist before it can be copied. A key file is named in
 * application.yml by its absolute path, because the service starts in another working directory.
 */
public final class MasterKeyStep implements SetupStep {

	static final String QUESTION = "How do you give OpenCelium its master key?";

	static final String BACKUP_QUESTION = "I have backed up the master key";

	private static final String GENERATE = "generate";

	private static final String ENV = "env";

	private static final String FILE_PREFIX = "file:";

	private static final String HOME = "~";

	private static final String VARIABLE = RootKeyResolver.ENV_VARIABLE;

	/** Why the master key matters, before the menu; each phrase that a reader looks for stays on one line. */
	private static final List<String> PURPOSE = List.of(
			"OpenCelium encrypts the credentials that it keeps, for example the API passwords and tokens",
			"of your connectors. The master key is the root key of this encryption.",
			"The master key stays outside the database: a copy of the database without it shows no credential.",
			"Keep a backup of the master key, but not in the same place as the database backup.",
			"Without the master key, OpenCelium cannot decrypt the credentials, and a new master key does not help.");

	private static final String WORDS = """
			How OpenCelium gets its master key:
			  generate      a new master key in <data-dir>/master.key; a master key that is there stays
			  env           the environment variable OC_MASTER_KEY
			  file:<path>   a key file that you have""";

	private static final String KEY_FILE_HELP = "Choose this when the master key is in a file, for example a mounted"
			+ " secret. OpenCelium reads the file at this path at each start, so keep it there. With the service, the"
			+ " system user opencelium must be able to read the file, as its owner or through its group, never as any"
			+ " other account. Do not put it under /tmp: the service does not see /tmp, and a reboot can delete it."
			+ " Make a key file that only you can read with: (umask 077; openssl rand -base64 32 > master.key)";

	private static final String NO_GENERATE_WITH_DATA_KEYS = "the database holds encrypted data keys, so the setup"
			+ " generates no master key; use " + ENV + " or " + FILE_PREFIX + "<path>.";

	/** The options of the menu; the first one depends on the data directory and the database. */
	private enum Source { GENERATE, KEEP, VARIABLE, KEY_FILE }

	private final MasterKeyGuard guard;

	private final Function<String, String> environment;

	private final Consumer<String> standardError;

	private final Path home;

	public MasterKeyStep() {
		this(new MasterKeyGuard(), System::getenv, System.err::println, Path.of(System.getProperty("user.home")));
	}

	/**
	 * @param environment   looks up the environment variables of this process
	 * @param standardError where the backup warning goes in batch mode, one line at a time
	 * @param home          the home directory for a typed {@code ~}
	 */
	public MasterKeyStep(MasterKeyGuard guard, Function<String, String> environment, Consumer<String> standardError,
			Path home) {
		this.guard = Objects.requireNonNull(guard, "guard");
		this.environment = Objects.requireNonNull(environment, "environment");
		this.standardError = Objects.requireNonNull(standardError, "standardError");
		this.home = Objects.requireNonNull(home, "home").toAbsolutePath().normalize();
	}

	@Override
	public List<Question> questions() {
		return List.of(question());
	}

	private static Question question() {
		return new Question(ValueKey.MASTER_KEY, "Master key", String.join("\n", PURPOSE) + "\n" + WORDS, GENERATE);
	}

	@Override
	public void run(SetupContext context, Prompter prompter) {
		Path dataDir = context.dataDir()
				.orElseThrow(() -> new IllegalStateException("The data directory step did not run."));
		String mongoUri = context.mongoUri()
				.orElseThrow(() -> new IllegalStateException("The MongoDB step did not run."));
		boolean dataKeys = guard.run(mongoUri, dataDir);
		Path dataDirKey = dataDir.resolve(RootKeyResolver.DATA_DIR_FILE_NAME);
		boolean keep = Files.exists(dataDirKey);
		if (keep) {
			RootKeyResolver.fileProblem(dataDirKey).ifPresent(problem -> {
				throw SetupFailedException.failure(problem + " Restore it from your backup, or delete it when no"
						+ " credential is stored yet.");
			});
		}
		boolean variableSet = environment.apply(VARIABLE) != null;
		Optional<String> word = context.values().given(question(),
				value -> wordProblem(value, dataKeys, keep, variableSet), UnaryOperator.identity(), prompter);
		if (word.isPresent()) {
			fromWord(word.get(), keep, dataDirKey, context, prompter);
			return;
		}
		prompter.print("");
		prompter.info(PURPOSE.getFirst(), PURPOSE.subList(1, PURPOSE.size()).toArray(String[]::new));
		if (variableSet) {
			prompter.print("");
			prompter.info(VARIABLE + " is set in the environment of this setup, so the setup shows no menu.");
			variable(context, prompter);
			return;
		}
		fromMenu(menu(dataKeys, keep), dataDirKey, context, prompter);
	}

	/**
	 * Keep or generate first, when one applies; then the variable and the key file. With data keys the guard has found
	 * their key before the menu, so no new key is offered; the check stays here so that a change of that order cannot
	 * offer one.
	 */
	private static List<Source> menu(boolean dataKeys, boolean keep) {
		List<Source> sources = new ArrayList<>();
		if (keep) {
			sources.add(Source.KEEP);
		}
		else if (!dataKeys) {
			sources.add(Source.GENERATE);
		}
		sources.add(Source.VARIABLE);
		sources.add(Source.KEY_FILE);
		return sources;
	}

	private void fromMenu(List<Source> sources, Path dataDirKey, SetupContext context, Prompter prompter) {
		List<Choice> choices = sources.stream().map(source -> choice(source, dataDirKey)).toList();
		while (true) {
			switch (sources.get(prompter.choice(QUESTION, choices, 0))) {
				case GENERATE -> {
					generate(dataDirKey, context, prompter);
					return;
				}
				case KEEP -> {
					keep(dataDirKey, context);
					return;
				}
				case VARIABLE -> {
					Optional<String> problem = variableProblem();
					if (problem.isEmpty()) {
						variable(context, prompter);
						return;
					}
					prompter.error(problem.get(), "Set it, then run the setup again, or choose another option.");
				}
				case KEY_FILE -> {
					String path = prompter.text("Key file", KEY_FILE_HELP, "", this::keyFileProblem);
					keyFile(keyFilePath(path), context);
					return;
				}
			}
		}
	}

	/** The setup file's word, which {@link #wordProblem} accepted. */
	private void fromWord(String word, boolean keep, Path dataDirKey, SetupContext context, Prompter prompter) {
		if (word.equals(GENERATE)) {
			if (keep) {
				keep(dataDirKey, context);
			}
			else {
				generate(dataDirKey, context, prompter);
			}
		}
		else if (word.equals(ENV)) {
			variable(context, prompter);
		}
		else {
			keyFile(keyFilePath(word.substring(FILE_PREFIX.length())), context);
		}
	}

	/**
	 * The problem with a word of the setup file; the message never quotes it, because it can be a key. Generate with
	 * data keys is refused even though the guard and the variable rule leave no way to it now, for the same reason as
	 * in {@link #menu}.
	 */
	private Optional<String> wordProblem(String word, boolean dataKeys, boolean keep, boolean variableSet) {
		if (variableSet && !word.equals(ENV)) {
			return Optional.of(VARIABLE + " is set in the environment of this setup, and the start takes the master key"
					+ " from it; use " + ENV + ", or unset the variable.");
		}
		if (word.equals(GENERATE)) {
			return dataKeys && !keep ? Optional.of(NO_GENERATE_WITH_DATA_KEYS) : Optional.empty();
		}
		if (word.equals(ENV)) {
			return variableProblem();
		}
		if (word.startsWith(FILE_PREFIX)) {
			return keyFileProblem(word.substring(FILE_PREFIX.length()));
		}
		return Optional.of("The value is not one of: " + GENERATE + ", " + ENV + ", " + FILE_PREFIX + "<path>.");
	}

	private Optional<String> variableProblem() {
		String value = environment.apply(VARIABLE);
		if (value == null) {
			return Optional.of(VARIABLE + " is not set in the environment of this setup.");
		}
		return RootKeyResolver.textProblem(value, VARIABLE);
	}

	/** The problem with a typed key file path; a master key typed by mistake is named, not quoted. */
	private Optional<String> keyFileProblem(String value) {
		if (value.isEmpty()) {
			return Optional.of("Please type the path of the key file.");
		}
		if (RootKeyResolver.textProblem(value, "The answer").isEmpty()) {
			return Optional.of("This is a master key, not the path of a key file. Type the path of the file.");
		}
		try {
			return RootKeyResolver.fileProblem(keyFilePath(value));
		}
		catch (InvalidPathException ex) {
			return Optional.of("This is not a valid path: " + ex.getReason() + ".");
		}
	}

	/** Absolute, with {@code ~} for the home directory. */
	private Path keyFilePath(String value) {
		String expanded = value.equals(HOME) ? home.toString()
				: value.startsWith(HOME + "/") ? home.resolve(value.substring(2)).toString() : value;
		return Path.of(expanded).toAbsolutePath().normalize();
	}

	private void generate(Path dataDirKey, SetupContext context, Prompter prompter) {
		context.filePlan().add(new NewMasterKey(dataDirKey, context.values().batch(), prompter, standardError));
		context.setMasterKey("a new master key in " + dataDirKey, Optional.empty());
	}

	private static void keep(Path dataDirKey, SetupContext context) {
		context.setMasterKey("the master key in " + dataDirKey + " (kept)", Optional.empty());
	}

	private static void variable(SetupContext context, Prompter prompter) {
		prompter.info("OpenCelium takes the master key from " + VARIABLE + ", and the setup writes it nowhere.",
				"Set " + VARIABLE + " in the environment of the service too, with the same value.");
		context.setMasterKey("the variable " + VARIABLE, Optional.empty());
	}

	private static void keyFile(Path file, SetupContext context) {
		context.setMasterKey("the key file " + file, Optional.of(file));
	}

	private static Choice choice(Source source, Path dataDirKey) {
		return switch (source) {
			case GENERATE -> new Choice("Generate", "a new master key in " + dataDirKey, "Choose this when you install"
					+ " OpenCelium on 1 host and have no master key. The setup writes 32 random bytes to " + dataDirKey
					+ ", readable by its owner only, and asks you to back up the file after the write.");
			case KEEP -> new Choice("Keep", "the master key in " + dataDirKey, dataDirKey + " holds the master key of"
					+ " this installation. The setup keeps it and writes no new one: a new master key could not decrypt"
					+ " what this one encrypted.");
			case VARIABLE -> new Choice("Variable", VARIABLE + " from the environment", "Choose this when the"
					+ " environment of the service gives the master key, for example from a secret store. The setup"
					+ " writes nothing; set " + VARIABLE + " in the environment of the service too. Make a master key"
					+ " with: openssl rand -base64 32");
			case KEY_FILE -> new Choice("Key file", "a master key that you have, in a file", KEY_FILE_HELP);
		};
	}

	/**
	 * The new key file and the question whether the user backed it up, after the other files are written. The key is
	 * made at this moment, with owner-only permissions from its creation, and never in the place of a file that exists:
	 * a key that appeared after the summary stays, and the plan rolls back. On a terminal the question comes again
	 * until the answer is yes; {@code q} cancels the setup, and the plan rolls back. In batch mode nobody can answer,
	 * so the warning goes to standard error and the setup goes on.
	 */
	private static final class NewMasterKey implements PlannedAction {

		private final Path path;

		private final boolean batch;

		private final Prompter prompter;

		private final Consumer<String> standardError;

		/** Top down, so the undo removes them bottom up. */
		private final List<Path> madeDirectories = new ArrayList<>();

		private boolean made;

		NewMasterKey(Path path, boolean batch, Prompter prompter, Consumer<String> standardError) {
			this.path = path;
			this.batch = batch;
			this.prompter = prompter;
			this.standardError = standardError;
		}

		@Override
		public String description() {
			return "Write a new master key to " + path + " and ask you to back it up";
		}

		@Override
		public List<PlannedFile> files() {
			return List.of();
		}

		@Override
		public void run() {
			make();
			if (batch) {
				standardError.accept("Back up the master key now: " + path);
				standardError.accept(PURPOSE.get(3));
				standardError.accept(PURPOSE.get(4));
				return;
			}
			var rows = new LinkedHashMap<String, String>();
			rows.put("Backup", "keep a copy, but not in the same place as the database backup");
			rows.put("If it is lost", "OpenCelium cannot decrypt the credentials, and a new key does not help");
			prompter.print("");
			prompter.info("The master key is in " + path);
			prompter.box("Back up the master key", rows);
			String help = "y: a copy of " + path + " is in a safe place.\nn: the setup shows the path again.";
			while (!prompter.yesNo(BACKUP_QUESTION, help, false)) {
				prompter.info("The master key is in " + path + ". Copy it to a safe place, then answer y.");
			}
		}

		private void make() {
			try {
				for (Path dir = path.getParent(); dir != null && !Files.exists(dir); dir = dir.getParent()) {
					madeDirectories.addFirst(dir);
				}
				Files.createDirectories(path.getParent());
				new RootKeyGenerator().generate(path).close();
				made = true;
			}
			catch (FileAlreadyExistsException ex) {
				throw new SetupActionException("A master key appeared at " + path + " after the summary. The setup"
						+ " keeps it and writes no new one; run the setup again to keep it.");
			}
			catch (IOException ex) {
				throw new SetupActionException("Cannot write the master key to " + path + ": " + ex.getMessage() + ".");
			}
		}

		/** Removes the key that this action made and the directories it made for it, the last one first. */
		@Override
		public Optional<String> undo() {
			if (made) {
				try {
					Files.deleteIfExists(path);
					made = false;
				}
				catch (IOException ex) {
					return Optional.of("Cannot delete the new master key " + path + "; please delete it by hand.");
				}
			}
			for (Path dir : madeDirectories.reversed()) {
				try {
					Files.deleteIfExists(dir);
				}
				catch (IOException ex) {
					// A directory that is not empty any more stays.
				}
			}
			return Optional.empty();
		}

	}

}
