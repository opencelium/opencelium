package io.opencelium.core.setup.values;

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
 * Where a step gets its value: a value from the setup file is checked, printed and taken without a question; an
 * absent value is asked, or, in non-interactive mode, stops the setup naming the key and the file.
 */
class ValueSourceTest {

	private static final Path FILE = Path.of("setup-values.yml");

	private static final Question PORT_QUESTION = new Question(ValueKey.PORT, "Web port", "help", "9090");

	private static final Function<String, Optional<String>> DIGITS = value -> value.chars().allMatch(Character::isDigit)
			? Optional.empty() : Optional.of("Please enter a number.");

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	@Test
	void textTakesFileValueAndPrintsItWithoutAsking() {
		ValueSource source = withFile(Map.of(ValueKey.PORT, "9091"), false);

		String value = source.text(PORT_QUESTION, DIGITS, prompter);

		assertThat(value).isEqualTo("9091");
		assertThat(console.output()).isEqualTo("  Web port        9091   (from setup-values.yml)\n");
	}

	@Test
	void textAsksWhenFileValueIsAbsent() {
		console.type("9092");
		ValueSource source = withFile(Map.of(), false);

		String value = source.text(PORT_QUESTION, DIGITS, prompter);

		assertThat(value).isEqualTo("9092");
		assertThat(console.output()).contains("  Web port        [9090]: ");
	}

	@Test
	void textThrowsMissingValueWhenNonInteractiveAndAbsent() {
		ValueSource source = withFile(Map.of(), true);

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(PORT_QUESTION, DIGITS, prompter)).actual();

		assertThat(ex.getMessage()).isEqualTo("Missing value: port in setup-values.yml\n"
				+ "A template with every key: java -jar oc-app.jar setup --template");
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(console.output()).isEmpty();
	}

	@Test
	void textThrowsNamingKeyAndFileWhenFileValueIsRejected() {
		ValueSource source = withFile(Map.of(ValueKey.PORT, "abc"), false);

		assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(PORT_QUESTION, DIGITS, prompter))
				.withMessage("Bad value: port in setup-values.yml: Please enter a number.");
	}

	@Test
	void yesNoTakesDefaultAndPrintsItWhenNonInteractive() {
		ValueSource source = withFile(Map.of(), true);

		assertThat(source.yesNo("Write the files?", "help", true, prompter)).isTrue();
		assertThat(source.yesNo("Write the files?", "help", false, prompter)).isFalse();
		assertThat(console.output()).isEqualTo("  Write the files? yes   (non-interactive)\n"
				+ "  Write the files? no   (non-interactive)\n");
	}

	@Test
	void yesNoAsksWhenInteractive() {
		console.type("n");
		ValueSource source = withFile(Map.of(), false);

		assertThat(source.yesNo("Write the files?", "help", true, prompter)).isFalse();
		assertThat(console.output()).contains("  Write the files? [Y/n]: ");
	}

	@Test
	void promptedSourceAsksEverything() {
		console.type("", "y");

		assertThat(ValueSource.PROMPTED.nonInteractive()).isFalse();
		assertThat(ValueSource.PROMPTED.text(PORT_QUESTION, DIGITS, prompter)).isEqualTo("9090");
		assertThat(ValueSource.PROMPTED.yesNo("Write?", "help", false, prompter)).isTrue();
	}

	private static ValueSource withFile(Map<ValueKey, String> values, boolean nonInteractive) {
		return new ValueSource(new SetupValues(values), Optional.of(FILE), nonInteractive);
	}

}
