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
 * Where a step gets its value: a value from the environment first, then a value from the setup file; each is
 * checked, printed and taken without a question. A bad value from the environment stops the setup, also on a
 * terminal, and a setup file value must agree with it. An absent value is asked, or, in batch mode, stops the setup
 * naming the key and the file.
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
	void textThrowsMissingValueWhenBatchAndAbsent() {
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
	void yesNoTakesDefaultAndPrintsItWhenBatch() {
		ValueSource source = withFile(Map.of(), true);

		assertThat(source.yesNo("Write the files?", "help", true, prompter)).isTrue();
		assertThat(source.yesNo("Write the files?", "help", false, prompter)).isFalse();
		assertThat(console.output()).isEqualTo("  Write the files? yes   (batch)\n"
				+ "  Write the files? no   (batch)\n");
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

		assertThat(ValueSource.PROMPTED.batch()).isFalse();
		assertThat(ValueSource.PROMPTED.text(PORT_QUESTION, DIGITS, prompter)).isEqualTo("9090");
		assertThat(ValueSource.PROMPTED.yesNo("Write?", "help", false, prompter)).isTrue();
	}

	@Test
	void textTakesTheValueWithoutQuestionWhenTheVariableIsSet() {
		// No input is scripted: a question would end the input and cancel the setup.
		ValueSource source = withEnvironment(Map.of(), false, Map.of("SERVER_PORT", "8080"));

		String value = source.text(PORT_QUESTION, DIGITS, prompter);

		assertThat(value).isEqualTo("8080");
		assertThat(console.output()).isEqualTo("  Web port        8080   (from the environment: SERVER_PORT)\n");
	}

	@Test
	void textStopsAndNamesTheVariableWhenTheValueIsBadOnTerminal() {
		ValueSource source = withEnvironment(Map.of(), false, Map.of("SERVER_PORT", "80a"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(PORT_QUESTION, DIGITS, prompter)).actual();

		// The environment applies at each start, so the setup does not ask again on a terminal either.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines()).containsExactly("Bad value: SERVER_PORT in the environment: Please enter a number.",
				"Repair the value of SERVER_PORT, or remove the variable. Each start reads it, so the setup does not"
						+ " ask again.");
		assertThat(console.output()).isEmpty();
	}

	@Test
	void textStopsAndNamesTheVariableWhenTheValueIsBadInBatchMode() {
		ValueSource source = withEnvironment(Map.of(), true, Map.of("SERVER_PORT", "80a"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(PORT_QUESTION, DIGITS, prompter)).actual();

		// The bad value, not a missing value: the variable gives the port.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines()).first().isEqualTo("Bad value: SERVER_PORT in the environment: Please enter a number.");
		assertThat(console.output()).isEmpty();
	}

	@Test
	void textStopsWhenTheSetupFileDiffersFromTheVariable() {
		ValueSource source = withEnvironment(Map.of(ValueKey.PORT, "9091"), true, Map.of("SERVER_PORT", "8080"));

		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(PORT_QUESTION, DIGITS, Integer::valueOf, prompter)).actual();

		// The key, the file and the variable, but no value.
		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.lines()).containsExactly("Different values: port in setup-values.yml and the variable"
				+ " SERVER_PORT.", "Remove one of them, or give both the same value.");
		assertThat(ex.getMessage()).doesNotContain("9091").doesNotContain("8080");
		assertThat(console.output()).isEmpty();
	}

	@Test
	void textStopsNamingTheKeyWhenTheSetupFileValueIsBadAndTheVariableIsSet() {
		ValueSource source = withEnvironment(Map.of(ValueKey.PORT, "abc"), true, Map.of("SERVER_PORT", "8080"));

		// The check of the setup file value comes before the comparison of the values.
		SetupFailedException ex = assertThatExceptionOfType(SetupFailedException.class)
				.isThrownBy(() -> source.text(PORT_QUESTION, DIGITS, Integer::valueOf, prompter)).actual();

		assertThat(ex.exitCode()).isEqualTo(1);
		assertThat(ex.getMessage()).isEqualTo("Bad value: port in setup-values.yml: Please enter a number.");
	}

	@Test
	void textAcceptsTheSetupFileWhenItAgreesWithTheVariable() {
		// 1 value in 2 texts: the setup compares the values, not the texts.
		ValueSource source = withEnvironment(Map.of(ValueKey.PORT, "08080"), true, Map.of("SERVER_PORT", "8080"));

		String value = source.text(PORT_QUESTION, DIGITS, Integer::valueOf, prompter);

		assertThat(value).isEqualTo("8080");
		assertThat(console.output()).isEqualTo("  Web port        8080   (from the environment: SERVER_PORT)\n");
	}

	@Test
	void textDoesNotStopInBatchModeWhenOnlyTheVariableGivesTheValue() {
		ValueSource source = withEnvironment(Map.of(), true, Map.of("SERVER_PORT", "8080"));

		assertThat(source.text(PORT_QUESTION, DIGITS, prompter)).isEqualTo("8080");
		assertThat(console.output()).contains("(from the environment: SERVER_PORT)").doesNotContain("Missing value");
	}

	private static ValueSource withFile(Map<ValueKey, String> values, boolean batch) {
		return new ValueSource(new SetupValues(values), Optional.of(FILE), batch);
	}

	private static ValueSource withEnvironment(Map<ValueKey, String> values, boolean batch,
			Map<String, String> variables) {
		return new ValueSource(new SetupValues(values), Optional.of(FILE), batch, new EnvironmentSnapshot(variables));
	}

}
