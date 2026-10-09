package io.opencelium.core.setup.answers;

import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.SetupFailedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The answers file: {@code key: value} lines in YAML, one key for each question. Each value is the text as written,
 * stripped, without YAML's type guessing, so it means what the same text typed at the prompt means. An absent or
 * blank key is asked later; an unknown or duplicated key, a value that is not one value, and a file that is
 * missing, unreadable or broken stop the setup naming the key or the file, so a typo never becomes a question
 * without a message.
 */
class AnswersFileTest {

	@TempDir
	Path tmp;

	@Test
	void loadReadsBothKeys() throws IOException {
		Path file = write("data-dir: ./data\nport: 9090\n");

		Answers answers = AnswersFile.load(file);

		assertThat(answers.get(AnswerKey.DATA_DIR)).contains("./data");
		assertThat(answers.get(AnswerKey.PORT)).contains("9090");
	}

	@Test
	void loadLeavesKeyEmptyWhenAbsentOrWithoutValue() throws IOException {
		assertThat(AnswersFile.load(write("port: 9090\n")).get(AnswerKey.DATA_DIR)).isEmpty();
		assertThat(AnswersFile.load(write("data-dir:\nport: 9090\n")).get(AnswerKey.DATA_DIR)).isEmpty();
		assertThat(AnswersFile.load(write("")).get(AnswerKey.PORT)).isEmpty();
	}

	@Test
	void loadReadsQuotedAndUnquotedValuesAlike() throws IOException {
		Path file = write("data-dir: \"/srv/oc #1\"\nport: '9090'\n");

		Answers answers = AnswersFile.load(file);

		assertThat(answers.get(AnswerKey.DATA_DIR)).contains("/srv/oc #1");
		assertThat(answers.get(AnswerKey.PORT)).contains("9090");
	}

	@Test
	void loadTreatsBlankValueAsAbsentAndStripsTheOthers() throws IOException {
		Answers answers = AnswersFile.load(write("data-dir: \"   \"\nport: \" 9090 \"\n"));

		assertThat(answers.get(AnswerKey.DATA_DIR)).isEmpty();
		assertThat(answers.get(AnswerKey.PORT)).contains("9090");
		assertThat(AnswersFile.load(write("data-dir: \"\"\n")).get(AnswerKey.DATA_DIR)).isEmpty();
	}

	@Test
	void loadKeepsValuesAsWrittenWithoutYamlTypes() throws IOException {
		// YAML 1.1 would read these as null, the octal number 8, true, and a date.
		assertThat(AnswersFile.load(write("data-dir: ~\nport: 010\n")).values())
				.containsEntry(AnswerKey.DATA_DIR, "~").containsEntry(AnswerKey.PORT, "010");
		assertThat(AnswersFile.load(write("data-dir: yes\n")).get(AnswerKey.DATA_DIR)).contains("yes");
		assertThat(AnswersFile.load(write("data-dir: 2001-01-01\n")).get(AnswerKey.DATA_DIR)).contains("2001-01-01");
	}

	@Test
	void loadThrowsNamingKeyWhenKeyIsDuplicated() throws IOException {
		Path file = write("port: 9090\nport: 9091\n");

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> AnswersFile.load(file))
				.withMessage("The answers file " + file + " cannot be read: found duplicate key port (line 2)");
	}

	@Test
	void loadThrowsPermissionDeniedWhenFileIsNotReadable() throws IOException {
		assumeTrue(posixAndNotRoot(), "needs POSIX permissions and a user that they apply to");
		Path file = write("port: 9090\n");
		Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("---------"));
		try {
			assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> AnswersFile.load(file))
					.withMessage("The answers file " + file + " cannot be read: permission denied");
		}
		finally {
			Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rw-------"));
		}
	}

	@Test
	void loadThrowsPermissionDeniedNotMissingWhenDirectoryIsNotSearchable() throws IOException {
		assumeTrue(posixAndNotRoot(), "needs POSIX permissions and a user that they apply to");
		Path locked = Files.createDirectory(tmp.resolve("locked"));
		Path file = Files.writeString(locked.resolve("setup-answers.yml"), "port: 9090\n");
		Files.setPosixFilePermissions(locked, PosixFilePermissions.fromString("---------"));
		try {
			assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> AnswersFile.load(file))
					.withMessage("The answers file " + file + " cannot be read: permission denied");
		}
		finally {
			Files.setPosixFilePermissions(locked, PosixFilePermissions.fromString("rwx------"));
		}
	}

	@Test
	void loadThrowsNamingFileWhenPathIsADirectory() {
		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> AnswersFile.load(tmp))
				.withMessage("The answers file " + tmp + " is a directory, not a file.");
	}

	@Test
	void loadThrowsNamingKeyWhenKeyIsUnknown() throws IOException {
		Path file = write("colour: blue\n");

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> AnswersFile.load(file)).actual();

		assertThat(ex.getMessage()).isEqualTo("Unknown key 'colour' in " + file + ". Known keys: data-dir, port.");
		assertThat(ex.exitCode()).isEqualTo(1);
	}

	@Test
	void loadThrowsNamingKeyWhenValueIsNotOneValue() throws IOException {
		Path file = write("port: [9090, 9091]\n");

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> AnswersFile.load(file))
				.withMessage("Bad answer: port in " + file + ": one value is expected.");
	}

	@Test
	void loadThrowsNamingFileWhenFileIsMissing() {
		Path file = tmp.resolve("missing.yml");

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> AnswersFile.load(file)).actual();

		assertThat(ex.getMessage()).isEqualTo("The answers file " + file + " does not exist.");
		assertThat(ex.exitCode()).isEqualTo(1);
	}

	@Test
	void loadThrowsNamingFileWhenYamlIsBroken() throws IOException {
		Path file = write("port: [\n");

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> AnswersFile.load(file))
				.withMessageStartingWith("The answers file " + file + " cannot be read: ");
	}

	@Test
	void loadThrowsNamingFileWhenTopLevelIsNotKeyValueLines() throws IOException {
		Path file = write("- data-dir\n- port\n");

		assertThatExceptionOfType(SetupFailedException.class).isThrownBy(() -> AnswersFile.load(file))
				.withMessage("The answers file " + file + " must hold key: value lines.");
	}

	private Path write(String content) throws IOException {
		return Files.writeString(tmp.resolve("setup-answers.yml"), content);
	}

	private static boolean posixAndNotRoot() {
		return FileSystems.getDefault().supportedFileAttributeViews().contains("posix")
				&& !"root".equals(System.getProperty("user.name"));
	}

}
