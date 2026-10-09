package io.opencelium.core.setup.answers;

import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.prompt.ConsolePrompter;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;

/**
 * Where a step gets its answer: a value from the answers file is checked, printed and taken without a question; an
 * absent value is asked, or, in non-interactive mode, stops the setup naming the key and the file.
 */
class AnswerSourceTest {

	private static final Path FILE = Path.of("setup-answers.yml");

	private static final Function<String, Optional<String>> DIGITS = value -> value.chars().allMatch(Character::isDigit)
			? Optional.empty() : Optional.of("Please enter a number.");

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	@Test
	void textTakesFileValueAndPrintsItWithoutAsking() {
		AnswerSource source = withFile(Map.of(AnswerKey.PORT, "9091"), false);

		String value = source.text(AnswerKey.PORT, "Web port", "help", "9090", DIGITS, prompter);

		assertThat(value).isEqualTo("9091");
		assertThat(console.output()).isEqualTo("  Web port        9091   (from the answers file)\n");
	}

	@Test
	void textAsksWhenFileValueIsAbsent() {
		console.type("9092");
		AnswerSource source = withFile(Map.of(), false);

		String value = source.text(AnswerKey.PORT, "Web port", "help", "9090", DIGITS, prompter);

		assertThat(value).isEqualTo("9092");
		assertThat(console.output()).contains("  Web port        [9090]: ");
	}

	@Test
	void textThrowsMissingAnswerWhenNonInteractiveAndAbsent() {
		AnswerSource source = withFile(Map.of(), true);

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(AnswerKey.PORT, "Web port", "help", "9090", DIGITS, prompter)).actual();

		assertThat(ex.getMessage()).isEqualTo("Missing answer: port in setup-answers.yml");
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(console.output()).isEmpty();
	}

	@Test
	void textThrowsNamingKeyAndFileWhenFileValueIsRejected() {
		AnswerSource source = withFile(Map.of(AnswerKey.PORT, "abc"), false);

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(AnswerKey.PORT, "Web port", "help", "9090", DIGITS, prompter))
				.withMessage("Bad answer: port in setup-answers.yml: Please enter a number.");
	}

	@Test
	void yesNoTakesDefaultAndPrintsItWhenNonInteractive() {
		AnswerSource source = withFile(Map.of(), true);

		assertThat(source.yesNo("Write the files?", "help", true, prompter)).isTrue();
		assertThat(source.yesNo("Write the files?", "help", false, prompter)).isFalse();
		assertThat(console.output()).isEqualTo("  Write the files? yes   (non-interactive)\n"
				+ "  Write the files? no   (non-interactive)\n");
	}

	@Test
	void yesNoAsksWhenInteractive() {
		console.type("n");
		AnswerSource source = withFile(Map.of(), false);

		assertThat(source.yesNo("Write the files?", "help", true, prompter)).isFalse();
		assertThat(console.output()).contains("  Write the files? [Y/n]: ");
	}

	@Test
	void promptedSourceAsksEverything() {
		console.type("", "y");

		assertThat(AnswerSource.PROMPTED.nonInteractive()).isFalse();
		assertThat(AnswerSource.PROMPTED.text(AnswerKey.PORT, "Web port", "help", "9090", DIGITS, prompter))
				.isEqualTo("9090");
		assertThat(AnswerSource.PROMPTED.yesNo("Write?", "help", false, prompter)).isTrue();
	}

	private static AnswerSource withFile(Map<AnswerKey, String> values, boolean nonInteractive) {
		return new AnswerSource(new Answers(values), Optional.of(FILE), nonInteractive);
	}

}
