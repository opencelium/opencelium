package io.opencelium.core.setup.steps;

import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.config.mongo.StaticMongoConnectionResolver;
import io.opencelium.core.secrets.keys.KeyStartupException;
import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.setup.SetupContext;
import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.files.PlannedAction;
import io.opencelium.core.setup.files.SetupActionException;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.setup.values.EnvironmentSnapshot;
import io.opencelium.core.setup.values.SetupValues;
import io.opencelium.core.setup.values.ValueKey;
import io.opencelium.core.setup.values.ValueSource;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The master key step: it says first why the master key matters, then offers to generate a new key into the data
 * directory or to read a key file; a key that the data directory holds is kept. The variables {@code OC_MASTER_KEY}
 * and {@code OPENCELIUM_MASTERKEYFILE} of the setup environment are taken without a menu, and the help of the menu
 * tells how to use {@code OC_MASTER_KEY}. The step writes nothing: a generated key is an action of the plan that
 * makes the key file after the write, never over a file that exists, and then asks the backup question. A key file
 * that is not a master key is named and asked again; a master key in a bad form in a source stops the setup, and so
 * does a setup file that does not agree with a variable. A key file path becomes absolute. In batch mode the setup
 * file gives the answer, and the backup warning goes to standard error.
 * The guard has a fake ping and a fake data key probe here: its own test reads a real database.
 */
class MasterKeyStepTest {

	private static final String QUESTION = "How do you give OpenCelium its master key?";

	private static final String BACKUP_QUESTION = "I have backed up the master key [y/N]";

	private static final String MONGO_URI = "mongodb://localhost:27017/opencelium";

	private static final Path FILE = Path.of("setup-values.yml");

	@TempDir
	Path tmp;

	private Path dataDir;

	private Path dataDirKey;

	private Path home;

	private final Map<String, String> environment = new HashMap<>();

	private final List<String> standardError = new ArrayList<>();

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	private final SetupContext context = new SetupContext();

	@BeforeEach
	void dataDirAndMongoDbAreChosen() {
		dataDir = tmp.resolve("data");
		dataDirKey = dataDir.resolve("master.key");
		home = tmp.resolve("home");
		context.setDataDir(dataDir);
		context.setMongoUri(MONGO_URI);
	}

	@Test
	void runOffersTwoOptionsWhenTheEnvironmentHasNoKey() {
		console.type("");

		step().run(context, prompter);

		// The variable is no option: the setup takes OC_MASTER_KEY from its environment, without a menu.
		assertThat(console.output()).containsSubsequence(QUESTION, "1) Generate", "2) Key file").doesNotContain("3)")
				.doesNotContain("Variable");
	}

	@Test
	void runTellsThePurposeOfTheMasterKeyBeforeTheOptions() {
		console.type("");

		step().run(context, prompter);

		assertThat(console.output()).containsSubsequence("encrypts the credentials", "root key of this encryption",
				"stays outside the database", "the database backup", "cannot decrypt the credentials", QUESTION);
	}

	@Test
	void runPrintsWhenToSelectEachOptionWhenUserTypesQuestionMark() {
		console.type("?", "");

		step().run(context, prompter);

		// The help block ends at the next prompt of the menu.
		String help = between(console.output(), "1) Generate: ", "Choice [");
		assertThat(help).containsSubsequence("1) Generate: ", "2) Key file: ");
		assertThat(between(help, "1) Generate: ", "2) Key file: ")).contains("1 host", "no master key");
		assertThat(help.substring(help.indexOf("2) Key file: "))).contains("mounted secret", "at each start",
				"system user opencelium", "/tmp", "umask 077; openssl rand -base64 32");
	}

	@Test
	void runTellsHowToUseTheMasterKeyVariableWhenTheUserTypesQuestionMark() {
		console.type("?", "");

		step().run(context, prompter);

		// After the help of the options: set the variable before the setup, then run the setup again.
		String help = between(console.output(), "1) Generate: ", "Choice [");
		assertThat(help).containsSubsequence("2) Key file: ", "OC_MASTER_KEY", "openssl rand -base64 32",
				"setup again");
	}

	@Test
	void runWritesAnOwnerOnlyKeyFileAfterTheWriteWhenGenerateIsChosen() throws Exception {
		console.type("");

		step().run(context, prompter);

		assertThat(context.filePlan().files()).isEmpty();
		assertThat(context.filePlan().actions()).hasSize(1);
		assertThat(dataDirKey).doesNotExist();
		assertThat(context.masterKeyFile()).isEmpty();
		assertThat(context.masterKeySource()).isPresent();

		console.type("y");
		backupAction().run();

		assertThat(Base64.getDecoder().decode(Files.readString(dataDirKey).strip())).hasSize(32);
		assumeTrue(FileSystems.getDefault().supportedFileAttributeViews().contains("posix"), "POSIX permissions");
		assertThat(PosixFilePermissions.toString(Files.getPosixFilePermissions(dataDirKey))).isEqualTo("rw-------");
	}

	@Test
	void runAsksBackupConfirmationAfterTheWrite() {
		console.type("");
		step().run(context, prompter);
		assertThat(console.output()).doesNotContain(BACKUP_QUESTION);

		console.type("y");
		backupAction().run();

		assertThat(console.output()).contains(BACKUP_QUESTION);
	}

	@Test
	void runPrintsPathAgainAndAsksAgainWhenAnswerIsNo() {
		console.type("");
		step().run(context, prompter);
		int before = console.output().length();

		console.type("", "n", "y");
		backupAction().run();

		String backup = console.output().substring(before);
		assertThat(occurrences(backup, BACKUP_QUESTION)).isEqualTo(3);
		assertThat(occurrences(backup, dataDirKey.toString())).isGreaterThanOrEqualTo(3);
	}

	@Test
	void runBackupBoxTellsBackupPlaceAndLossOfCredentials() {
		console.type("");
		step().run(context, prompter);
		int before = console.output().length();

		console.type("y");
		backupAction().run();

		assertThat(console.output().substring(before)).containsSubsequence("Back up the master key",
				"the database backup", "cannot decrypt the credentials", BACKUP_QUESTION);
	}

	@Test
	void runStopsWithoutReplacingAKeyThatAppearsBeforeTheWrite() throws Exception {
		console.type("");
		step().run(context, prompter);
		String key = storeDataDirKey();

		assertThatExceptionOfType(SetupActionException.class).isThrownBy(() -> backupAction().run())
				.withMessageContaining(dataDirKey.toString());
		backupAction().undo();

		assertThat(dataDirKey).content().isEqualTo(key);
	}

	@Test
	void runRemovesTheNewKeyAndTheDirectoryItMadeWhenThePlanRollsBack() {
		console.type("");
		step().run(context, prompter);
		console.type("y");
		backupAction().run();

		assertThat(backupAction().undo()).isEmpty();

		assertThat(dataDirKey).doesNotExist();
		assertThat(dataDir).doesNotExist();
	}

	@Test
	void runCancelsTheSetupWhenTheBackupQuestionIsCancelled() {
		console.type("");
		step().run(context, prompter);

		console.type("q");

		assertThatExceptionOfType(SetupCancelledException.class).isThrownBy(() -> backupAction().run());
	}

	@Test
	void runPrintsWarningToStandardErrorAndContinuesInBatchMode() {
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "generate"));

		step().run(batch, prompter);
		// No scripted input: a question here would end the input and cancel the setup.
		batch.filePlan().actions().getFirst().run();

		assertThat(dataDirKey).exists();
		assertThat(String.join("\n", standardError)).contains(dataDirKey.toString(), "the database backup",
				"cannot decrypt the credentials");
		assertThat(console.output()).doesNotContain(BACKUP_QUESTION);
	}

	@Test
	void runPrintsTheBatchWarningWithAQuestionMarkWhenTheDataDirectoryHasAControlCharacter() {
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "generate"));
		batch.setDataDir(dataDir.resolve("oc\u001B[41mx"));

		step().run(batch, prompter);
		batch.filePlan().actions().getFirst().run();

		assertThat(String.join("\n", standardError)).contains("oc?[41mx").doesNotContain("\u001B");
	}

	@Test
	void runKeepsTheMasterKeyAndPlansNothingWhenDataDirHoldsOne() throws Exception {
		String key = storeDataDirKey();
		console.type("");

		step().run(context, prompter);

		assertThat(console.output()).contains("1) Keep").doesNotContain("1) Generate");
		assertThat(context.filePlan().isEmpty()).isTrue();
		assertThat(dataDirKey).content().isEqualTo(key);
		assertThat(context.masterKeySource()).isPresent();
		assertThat(context.masterKeyFile()).isEmpty();
	}

	@Test
	void runKeepsTheMasterKeyWhenTheSetupFileSaysGenerateAndDataDirHoldsOne() throws Exception {
		String key = storeDataDirKey();
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "generate"));

		step().run(batch, prompter);

		assertThat(batch.filePlan().isEmpty()).isTrue();
		assertThat(dataDirKey).content().isEqualTo(key);
	}

	@Test
	void runStopsNamingTheFileWhenTheDataDirKeyIsNotAMasterKey() throws Exception {
		Files.createDirectories(dataDir);
		Files.writeString(dataDirKey, "garbage*text");

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step().run(context, prompter)).actual();

		assertThat(ex.getMessage()).contains(dataDirKey.toString(), "not valid base64").doesNotContain("garbage*text");
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(console.output()).doesNotContain(QUESTION);
		assertThat(dataDirKey).content().isEqualTo("garbage*text");
	}

	@Test
	void runTakesTheVariableWhenTheDatabaseHoldsDataKeysAndItIsSet() {
		environment.put("OC_MASTER_KEY", randomKey());
		SetupContext fromVariables = withVariables();

		stepWithDataKeys().run(fromVariables, prompter);

		assertThat(console.output()).doesNotContain(QUESTION).doesNotContain("Generate");
		assertThat(fromVariables.filePlan().isEmpty()).isTrue();
		assertThat(fromVariables.masterKeySource())
				.hasValueSatisfying(source -> assertThat(source).contains("OC_MASTER_KEY"));
	}

	@Test
	void runKeepsTheMasterKeyWhenTheDatabaseHoldsDataKeysAndDataDirHoldsOne() throws Exception {
		String key = storeDataDirKey();
		console.type("");

		stepWithDataKeys().run(context, prompter);

		assertThat(console.output()).containsSubsequence(QUESTION, "1) Keep", "2) Key file").doesNotContain("3)")
				.doesNotContain("Generate");
		assertThat(context.filePlan().isEmpty()).isTrue();
		assertThat(dataDirKey).content().isEqualTo(key);
	}

	@Test
	void runKeepsTheMasterKeyInBatchModeWhenDataKeysAndDataDirKeyExist() throws Exception {
		String key = storeDataDirKey();
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "generate"));

		stepWithDataKeys().run(batch, prompter);

		assertThat(batch.filePlan().isEmpty()).isTrue();
		assertThat(dataDirKey).content().isEqualTo(key);
	}

	@Test
	void runStopsInBatchModeWhenTheFileSaysGenerateAndTheVariableIsSet() {
		environment.put("OC_MASTER_KEY", randomKey());
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "generate"));

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> step().run(batch, prompter))
				.withMessageStartingWith("Bad value: master-key in " + FILE + ": ")
				.withMessageContaining("OC_MASTER_KEY is set");
		assertThat(batch.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runStopsWithoutQuotingTheValueWhenTheVariableIsNotAMasterKey() {
		environment.put("OC_MASTER_KEY", "not*a*key");
		SetupContext fromVariables = withVariables();

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step().run(fromVariables, prompter)).actual();

		assertThat(ex.getMessage()).contains("OC_MASTER_KEY is not valid base64").doesNotContain("not*a*key");
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(console.output()).doesNotContain(QUESTION).doesNotContain("not*a*key");
	}

	@Test
	void runTakesTheVariableWithoutTheMenuWhenItIsSet() {
		environment.put("OC_MASTER_KEY", randomKey());
		SetupContext fromVariables = withVariables();

		step().run(fromVariables, prompter);

		assertThat(console.output()).doesNotContain(QUESTION)
				.containsSubsequence("OC_MASTER_KEY is set", "environment of the service");
		assertThat(fromVariables.filePlan().isEmpty()).isTrue();
		assertThat(fromVariables.masterKeyFile()).isEmpty();
		assertThat(fromVariables.masterKeySource()).isPresent();
	}

	@Test
	void runTakesTheKeyFileWithoutMenuWhenTheKeyFileVariableIsSet() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		environment.put("OPENCELIUM_MASTERKEYFILE", good.toString());
		SetupContext fromVariables = withVariables();

		step().run(fromVariables, prompter);

		assertThat(console.output()).doesNotContain(QUESTION)
				.contains(good + "   (from the environment: OPENCELIUM_MASTERKEYFILE)");
		// The variable stays the only source: application.yml names no key file.
		assertThat(fromVariables.masterKeyFile()).isEmpty();
		assertThat(fromVariables.masterKeySource()).hasValueSatisfying(source -> assertThat(source)
				.contains(good.toString()));
		assertThat(fromVariables.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runTakesTheVariableInBatchModeWhenTheSetupFileHasNoMasterKey() {
		environment.put("OC_MASTER_KEY", randomKey());
		SetupContext batch = batch(Map.of());

		step().run(batch, prompter);

		// The variable gives the master key, so the absent key of the setup file is no missing value.
		assertThat(batch.filePlan().isEmpty()).isTrue();
		assertThat(batch.masterKeySource()).hasValueSatisfying(source -> assertThat(source).contains("OC_MASTER_KEY"));
		assertThat(console.output()).doesNotContain(QUESTION).doesNotContain("Missing value");
	}

	@Test
	void runChecksTheDatabaseOfTheEnvironmentWhenTheConnectionComesFromVariables() {
		// Only the database of the variable holds encrypted data keys, and no source has their master key.
		var guard = new MasterKeyGuard(connection -> Optional.empty(),
				connection -> connection.databaseName().equals("oc_variable"));
		var fromVariables = new SetupContext(new ValueSource(SetupValues.NONE, Optional.empty(), false,
				new EnvironmentSnapshot(Map.of("SPRING_MONGODB_URI", "mongodb://db.example/oc_variable"))));
		fromVariables.setDataDir(dataDir);
		fromVariables.setMongoConnection(StaticMongoConnectionResolver.parseUri("mongodb://db.example/oc_variable"),
				List.of("SPRING_MONGODB_URI"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> new MasterKeyStep(guard, standardError::add, home).run(fromVariables, prompter))
				.actual();

		assertThat(ex.getMessage()).startsWith(KeyStartupException.RESTORE_OR_RESET)
				.contains("mongodb://db.example/oc_variable");
		assertThat(console.output()).doesNotContain(QUESTION);
	}

	@Test
	void runStopsWhenBothKeyVariablesAreSet() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		String key = randomKey();
		environment.put("OC_MASTER_KEY", key);
		environment.put("OPENCELIUM_MASTERKEYFILE", good.toString());
		SetupContext fromVariables = withVariables();

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step().run(fromVariables, prompter)).actual();

		// The start does not accept both, so the setup does not ask: it names both variables.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).contains("OC_MASTER_KEY", "OPENCELIUM_MASTERKEYFILE").doesNotContain(key);
		assertThat(console.output()).doesNotContain(QUESTION).doesNotContain(key);
		assertThat(fromVariables.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runStopsNamingTheVariableWhenTheKeyFileOfTheVariableDoesNotExist() {
		Path missing = tmp.resolve("keys/missing.key");
		environment.put("OPENCELIUM_MASTERKEYFILE", missing.toString());
		SetupContext fromVariables = withVariables();

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step().run(fromVariables, prompter)).actual();

		// The variable applies at each start, so the setup does not ask for another key file.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines().getFirst()).startsWith("Bad value: OPENCELIUM_MASTERKEYFILE in the environment: ")
				.contains("does not exist");
		assertThat(ex.getMessage()).contains("remove the variable");
		assertThat(console.output()).doesNotContain(QUESTION);
	}

	@Test
	void runAsksAgainWhenFileIsMissing() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		Path missing = tmp.resolve("keys/missing.key");
		console.type("2", missing.toString(), good.toString());

		step().run(context, prompter);

		assertThat(console.output()).contains(missing + " does not exist");
		assertThat(context.masterKeyFile()).contains(good);
	}

	@Test
	void runAsksAgainWhenFileIsNot32Bytes() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		Path shortKey = tmp.resolve("keys/short.key");
		String shortText = Base64.getEncoder().encodeToString(new byte[16]);
		Files.writeString(shortKey, shortText);
		console.type("2", shortKey.toString(), good.toString());

		step().run(context, prompter);

		assertThat(console.output()).contains("decodes to 16 bytes, expected 32").doesNotContain(shortText);
		assertThat(context.masterKeyFile()).contains(good);
	}

	@Test
	void runWritesMasterKeyFilePropertyWhenFileIsChosen() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		console.type("2", good.toString());

		step().run(context, prompter);

		assertThat(context.masterKeyFile()).contains(good);
		assertThat(context.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runWritesAbsoluteKeyFilePathWhenPathIsRelative() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		Path relative = Path.of("").toAbsolutePath().relativize(good);
		console.type("2", relative.toString());

		step().run(context, prompter);

		assertThat(context.masterKeyFile()).contains(good);
	}

	@Test
	void runExpandsTheHomeDirectoryWhenTheKeyFilePathStartsWithTilde() throws Exception {
		Path good = storeKeyFile(home.resolve("oc/master.key"));
		console.type("2", "~/oc/master.key");

		step().run(context, prompter);

		assertThat(context.masterKeyFile()).contains(good);
	}

	@Test
	void runTakesTheKeyFileFromTheSetupFile() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "file:" + good));

		step().run(batch, prompter);

		assertThat(batch.masterKeyFile()).contains(good);
		assertThat(batch.filePlan().isEmpty()).isTrue();
		assertThat(console.output()).contains("from " + FILE);
	}

	@Test
	void runStopsInBatchModeWhenTheFileNamesAKeyFileAndTheVariableIsSet() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		environment.put("OC_MASTER_KEY", randomKey());
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "file:" + good));

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> step().run(batch, prompter))
				.withMessageStartingWith("Bad value: master-key in " + FILE + ": ")
				.withMessageContaining("OC_MASTER_KEY is set");
		assertThat(batch.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runAcceptsTheSetupFileWhenItNamesTheKeyFileOfTheVariable() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		environment.put("OPENCELIUM_MASTERKEYFILE", good.toString());
		// 1 file in 2 texts: the setup compares the absolute paths.
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "file:" + Path.of("").toAbsolutePath()
				.relativize(good)));

		step().run(batch, prompter);

		assertThat(batch.masterKeyFile()).isEmpty();
		assertThat(batch.masterKeySource()).hasValueSatisfying(source -> assertThat(source).contains(good.toString()));
		assertThat(batch.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runStopsWhenTheSetupFileNamesAnotherKeyFileThanTheVariable() throws Exception {
		Path good = storeKeyFile(tmp.resolve("keys/master.key"));
		Path other = storeKeyFile(tmp.resolve("keys/other.key"));
		environment.put("OPENCELIUM_MASTERKEYFILE", good.toString());
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "file:" + other));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> step().run(batch, prompter)).actual();

		// The key, the file and the variable, but no value.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).contains("master-key", FILE.toString(), "OPENCELIUM_MASTERKEYFILE")
				.doesNotContain(good.toString()).doesNotContain(other.toString());
		assertThat(batch.filePlan().isEmpty()).isTrue();
	}

	@Test
	void runAcceptsTheSetupFileWhenItSaysEnvAndTheVariableIsSet() {
		environment.put("OC_MASTER_KEY", randomKey());
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "env"));

		step().run(batch, prompter);

		assertThat(batch.filePlan().isEmpty()).isTrue();
		assertThat(batch.masterKeyFile()).isEmpty();
		assertThat(batch.masterKeySource()).hasValueSatisfying(source -> assertThat(source).contains("OC_MASTER_KEY"));
		assertThat(console.output()).doesNotContain(QUESTION);
	}

	@Test
	void runStopsWhenTheSetupFileSaysEnvAndTheVariableIsMissing() {
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, "env"));

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> step().run(batch, prompter))
				.withMessageStartingWith("Bad value: master-key in " + FILE + ": ")
				.withMessageContaining("OC_MASTER_KEY is not set");
	}

	@Test
	void runStopsWithoutQuotingTheValueWhenTheSetupFileWordIsUnknown() {
		String key = randomKey();
		// The master key itself under the key, by mistake.
		SetupContext batch = batch(Map.of(ValueKey.MASTER_KEY, key));

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> step().run(batch, prompter))
				.withMessageStartingWith("Bad value: master-key in " + FILE + ": ")
				.withMessageContaining("generate, env, file:<path>").withMessageNotContaining(key);
		assertThat(console.output()).doesNotContain(key);
	}

	@Test
	void runStopsWithoutTheMenuWhenTheGuardStops() {
		var guard = new MasterKeyGuard(connection -> Optional.empty(), connection -> true);

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> new MasterKeyStep(guard, standardError::add, home).run(context, prompter));

		assertThat(console.output()).doesNotContain(QUESTION);
		assertThat(context.filePlan().isEmpty()).isTrue();
	}

	@Test
	void questionsGiveTheTemplateThePurposeAndTheWords() {
		assertThat(step().questions()).singleElement().satisfies(question -> {
			assertThat(question.key()).isEqualTo(ValueKey.MASTER_KEY);
			assertThat(question.defaultValue()).isEqualTo("generate");
			assertThat(question.help()).contains("encrypts the credentials", "generate", "env", "file:<path>");
		});
	}

	private MasterKeyStep step() {
		var noDataKeys = new MasterKeyGuard(connection -> Optional.empty(), connection -> false);
		return new MasterKeyStep(noDataKeys, standardError::add, home);
	}

	/** The database holds encrypted data keys; each test gives their master key. */
	private MasterKeyStep stepWithDataKeys() {
		var dataKeys = new MasterKeyGuard(connection -> Optional.empty(), connection -> true);
		return new MasterKeyStep(dataKeys, standardError::add, home);
	}

	private PlannedAction backupAction() {
		return context.filePlan().actions().getFirst();
	}

	/** Batch mode with a setup file of these values, and the variables of {@link #environment}. */
	private SetupContext batch(Map<ValueKey, String> values) {
		var batch = new SetupContext(new ValueSource(new SetupValues(values), Optional.of(FILE), true,
				new EnvironmentSnapshot(environment)));
		batch.setDataDir(dataDir);
		batch.setMongoUri(MONGO_URI);
		return batch;
	}

	/** A terminal, no setup file, and the variables of {@link #environment}. */
	private SetupContext withVariables() {
		var fromVariables = new SetupContext(new ValueSource(SetupValues.NONE, Optional.empty(), false,
				new EnvironmentSnapshot(environment)));
		fromVariables.setDataDir(dataDir);
		fromVariables.setMongoUri(MONGO_URI);
		return fromVariables;
	}

	private String storeDataDirKey() throws Exception {
		Files.createDirectories(dataDir);
		String key = randomKey();
		Files.writeString(dataDirKey, key);
		return key;
	}

	private static Path storeKeyFile(Path file) throws Exception {
		Files.createDirectories(file.getParent());
		Files.writeString(file, randomKey() + "\n");
		return file;
	}

	private static String randomKey() {
		byte[] key = new byte[32];
		new SecureRandom().nextBytes(key);
		return Base64.getEncoder().encodeToString(key);
	}

	private static String between(String text, String start, String end) {
		int from = text.indexOf(start);
		return text.substring(from, text.indexOf(end, from));
	}

	private static int occurrences(String text, String part) {
		int count = 0;
		for (int at = text.indexOf(part); at >= 0; at = text.indexOf(part, at + part.length())) {
			count++;
		}
		return count;
	}

}
