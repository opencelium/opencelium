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
import java.util.function.UnaryOperator;

import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.config.TerminalText;
import io.opencelium.core.secrets.keys.RootKeyGenerator;
import io.opencelium.core.secrets.keys.RootKeyResolver;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.SetupActionException;
import io.opencelium.core.setup.files.PlannedFile;
import io.opencelium.core.setup.prompt.Choice;
import io.opencelium.core.setup.prompt.Prompter;
import io.opencelium.core.setup.values.EnvironmentSnapshot;
import io.opencelium.core.setup.values.Question;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.values.ValueSource;

/**
 * Where the master key comes from. The master key is the root of the encryption of the stored credentials, so the
 * step first says why it matters, then offers to generate a new key into the data directory or to read a key file;
 * its help tells how to give the key in {@code OC_MASTER_KEY} instead. A key that the data directory holds already
 * is kept, never replaced: a new key could not read what the old one encrypted. Before the menu the guard makes sure
 * that the database holds no encrypted data keys without their key; when it holds some, the step generates no key.
 * <p>
 * When {@code OC_MASTER_KEY} or {@code OPENCELIUM_MASTERKEYFILE} is set in the environment of the setup, the step
 * takes it without a menu: each start reads the variable first, so another answer would not be the key that the start
 * uses. The start does not accept both, and a variable in a bad form stops the setup; neither is asked again. A
 * setup file must agree: {@code env} with {@code OC_MASTER_KEY}, and {@code file:<path>} with the same file as
 * {@code OPENCELIUM_MASTERKEYFILE}. No file names the key file of the variable, so the variable stays its only source.
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

	/** How to give the master key in the variable, which the menu does not offer: the setup takes it without one. */
	private static final String VARIABLE_HELP = "To give the master key in " + RootKeyResolver.ENV_VARIABLE
			+ " instead, for example from a secret store: end the setup with q, set the variable, for example with"
			+ " export " + RootKeyResolver.ENV_VARIABLE + "=\"$(openssl rand -base64 32)\", and run the setup again."
			+ " The setup then takes the variable and shows no menu. Set it in the environment of the service too.";

	private static final String NO_GENERATE_WITH_DATA_KEYS = "the database holds encrypted data keys, so the setup"
			+ " generates no master key; use " + ENV + " or " + FILE_PREFIX + "<path>.";

	/** The options of the menu; the first one depends on the data directory and the database. */
	private enum Source { GENERATE, KEEP, KEY_FILE }

	private final MasterKeyGuard guard;

	private final Consumer<String> standardError;

	private final Path home;

	public MasterKeyStep() {
		this(new MasterKeyGuard(), System.err::println, Path.of(System.getProperty("user.home")));
	}

	/**
	 * @param standardError where the backup warning goes in batch mode, one line at a time
	 * @param home          the home directory for a typed {@code ~}
	 */
	public MasterKeyStep(MasterKeyGuard guard, Consumer<String> standardError, Path home) {
		this.guard = Objects.requireNonNull(guard, "guard");
		this.standardError = Objects.requireNonNull(standardError, "standardError");
		this.home = Objects.requireNonNull(home, "home").toAbsolutePath().normalize();
	}

	@Override
	public String name() {
		return "Master key";
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
		ValueSource values = context.values();
		EnvironmentSnapshot environment = values.environment();
		Optional<String> keyVariable = environment.text(VARIABLE);
		Optional<EnvironmentSnapshot.Value> fileVariable = environment.value(OpenCeliumProperties.MASTER_KEY_FILE);
		checkVariables(keyVariable, fileVariable, environment);
		boolean dataKeys = guard.run(context.mongoConnection(), dataDir, environment);
		Path dataDirKey = dataDir.resolve(RootKeyResolver.DATA_DIR_FILE_NAME);
		boolean keep = Files.exists(dataDirKey);
		if (keep) {
			RootKeyResolver.fileProblem(dataDirKey).ifPresent(problem -> {
				throw SetupFailedException.failure(problem + " Restore it from your backup, or delete it when no"
						+ " credential is stored yet.");
			});
		}
		fileVariable.ifPresent(variable -> agreeWithKeyFileVariable(values, variable));
		boolean fromVariable = keyVariable.isPresent() || fileVariable.isPresent();
		// A variable answers the question, so a setup file without the key is no missing value in batch mode.
		Optional<String> word = fromVariable && values.fromFile(ValueKey.MASTER_KEY).isEmpty() ? Optional.empty()
				: values.given(question(), value -> wordProblem(value, dataKeys, keep, keyVariable),
						UnaryOperator.identity(), prompter);
		if (word.isPresent()) {
			fromWord(word.get(), keep, dataDirKey, fileVariable, context, prompter);
			return;
		}
		prompter.info(PURPOSE.getFirst(), PURPOSE.subList(1, PURPOSE.size()).toArray(String[]::new));
		if (keyVariable.isPresent()) {
			prompter.print("");
			prompter.info(VARIABLE + " is set in the environment of this setup, so the setup shows no menu.");
			variable(context, prompter);
			return;
		}
		if (fileVariable.isPresent()) {
			prompter.print("");
			keyFileVariable(fileVariable.get(), context, prompter);
			return;
		}
		fromMenu(menu(dataKeys, keep), dataDirKey, context, prompter);
	}

	/**
	 * The variables of the master key as the start would read them: not both, and each with a master key. The setup
	 * stops before the guard, so the message names the variables, and it asks nothing, because each start reads them.
	 * A master key in the key file variable by mistake is named, not quoted: the message of a missing file would
	 * show it as a part of the path.
	 */
	private static void checkVariables(Optional<String> keyVariable, Optional<EnvironmentSnapshot.Value> fileVariable,
			EnvironmentSnapshot environment) {
		if (keyVariable.isPresent() && fileVariable.isPresent()) {
			String both = VARIABLE + " and " + fileVariable.get().variable();
			throw SetupFailedException.failure("Bad value: " + both + " are both set in the environment, and the start"
					+ " does not accept both.", "Remove 1 of them: the master key must come from exactly 1 source. Each"
							+ " start reads them, so the setup does not ask.");
		}
		keyVariable.flatMap(key -> RootKeyResolver.textProblem(key, VARIABLE)).ifPresent(problem -> {
			throw ValueSource.badVariable(List.of(VARIABLE), problem);
		});
		fileVariable.ifPresent(variable -> {
			String asWritten = environment.text(variable.variable()).orElse(variable.text());
			if (RootKeyResolver.textProblem(asWritten, variable.variable()).isEmpty()) {
				throw ValueSource.badVariable(List.of(variable.variable()), "This is a master key, not the path of a"
						+ " key file. Give the master key in " + VARIABLE + " instead.");
			}
			Optional<String> problem;
			try {
				problem = RootKeyResolver.fileProblem(Path.of(variable.text()));
			}
			catch (InvalidPathException ex) {
				problem = Optional.of("This is not a valid path: " + ex.getReason() + ".");
			}
			problem.ifPresent(text -> {
				throw ValueSource.badVariable(List.of(variable.variable()), text);
			});
		});
	}

	/**
	 * With the key file variable, the setup file must name the same file, compared as absolute paths. Another word of
	 * the step stops the setup without a quote of either path; a word that the step does not know stops it later, as a
	 * bad value of the setup file.
	 */
	private void agreeWithKeyFileVariable(ValueSource values, EnvironmentSnapshot.Value variable) {
		Optional<String> word = values.fromFile(ValueKey.MASTER_KEY)
				.filter(text -> text.equals(GENERATE) || text.equals(ENV) || text.startsWith(FILE_PREFIX));
		if (word.isPresent() && !sameKeyFile(word.get(), variable)) {
			throw values.different(ValueKey.MASTER_KEY, List.of(variable.variable()));
		}
	}

	private boolean sameKeyFile(String word, EnvironmentSnapshot.Value variable) {
		if (!word.startsWith(FILE_PREFIX)) {
			return false;
		}
		try {
			return keyFilePath(word.substring(FILE_PREFIX.length())).equals(Path.of(variable.text()));
		}
		catch (InvalidPathException ex) {
			// Not a path: the check of the word names the problem.
			return true;
		}
	}

	/**
	 * Keep or generate first, when one applies; then the key file. With data keys the guard has found their key
	 * before the menu, so no new key is offered; the check stays here so that a change of that order cannot offer
	 * one.
	 */
	private static List<Source> menu(boolean dataKeys, boolean keep) {
		List<Source> sources = new ArrayList<>();
		if (keep) {
			sources.add(Source.KEEP);
		}
		else if (!dataKeys) {
			sources.add(Source.GENERATE);
		}
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
				case KEY_FILE -> {
					String path = prompter.text("Key file", KEY_FILE_HELP, "", this::keyFileProblem);
					keyFile(keyFilePath(path), context);
					return;
				}
			}
		}
	}

	/**
	 * The setup file's word, which {@link #wordProblem} accepted. With the key file variable the word names the same
	 * file, and the variable stays its only source.
	 */
	private void fromWord(String word, boolean keep, Path dataDirKey, Optional<EnvironmentSnapshot.Value> fileVariable,
			SetupContext context, Prompter prompter) {
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
		else if (fileVariable.isPresent()) {
			keyFileVariable(fileVariable.get(), context, prompter);
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
	private Optional<String> wordProblem(String word, boolean dataKeys, boolean keep, Optional<String> keyVariable) {
		if (keyVariable.isPresent() && !word.equals(ENV)) {
			return Optional.of(VARIABLE + " is set in the environment of this setup, and the start takes the master key"
					+ " from it; use " + ENV + ", or unset the variable.");
		}
		if (word.equals(GENERATE)) {
			return dataKeys && !keep ? Optional.of(NO_GENERATE_WITH_DATA_KEYS) : Optional.empty();
		}
		if (word.equals(ENV)) {
			return keyVariable.isEmpty() ? Optional.of(VARIABLE + " is not set in the environment of this setup.")
					: Optional.empty();
		}
		if (word.startsWith(FILE_PREFIX)) {
			return keyFileProblem(word.substring(FILE_PREFIX.length()));
		}
		return Optional.of("The value is not one of: " + GENERATE + ", " + ENV + ", " + FILE_PREFIX + "<path>.");
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
		context.setMasterKeyFromVariable("the variable " + VARIABLE, VARIABLE);
	}

	/** The key file of the variable, which no file names: the start reads the variable at each start. */
	private static void keyFileVariable(EnvironmentSnapshot.Value variable, SetupContext context, Prompter prompter) {
		prompter.answered("Key file", variable.text(), "from the environment: " + variable.variable());
		prompter.info("OpenCelium reads the master key from this file, and the setup writes the path nowhere.",
				"Set " + variable.variable() + " in the environment of the service too, with the same path.");
		context.setMasterKeyFromVariable("the key file " + variable.text() + " from " + variable.variable(),
				variable.variable());
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
			// The last option: the way through the variable, which is no option, follows its help.
			case KEY_FILE -> new Choice("Key file", "a master key that you have, in a file", KEY_FILE_HELP + "\n"
					+ VARIABLE_HELP);
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
				// The path comes from the setup file, so a control character in it shows as ? on standard error too.
				for (String line : List.of("Back up the master key now: " + path, PURPOSE.get(3), PURPOSE.get(4))) {
					standardError.accept(TerminalText.printable(line));
				}
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
