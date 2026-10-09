package io.opencelium.core.setup.answers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.SetupFailedException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * The answers file: {@code key: value} lines in YAML, one key for each question. An absent key is asked later; an
 * unknown key, a value that is not one value, and a file that is missing or broken stop the setup naming the key or
 * the file, so a typo never becomes a question without a message.
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

}
