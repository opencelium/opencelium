package io.opencelium.core.setup.prompt;

import java.util.List;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

/**
 * The numbered choice on a console: Enter takes the default, a number picks an option, anything else is explained
 * and asked again, {@code ?} prints the help texts, and {@code q} or the end of the input cancels the setup. Bad
 * input never ends the wizard.
 */
class ConsolePrompterTest {

	private static final List<Choice> MODES = List.of(
			new Choice("Self-host", "one company, one database", "Help for self-host."),
			new Choice("Cloud", "many tenants", "Help for cloud."));

	private static final String QUESTION = "How will this OpenCelium run?";

	private static final String PROMPT = "  Choice [1]: ";

	private static final String RANGE_MESSAGE = "  Please enter a number between 1 and 2.";

	private final ScriptedConsoleIo console = new ScriptedConsoleIo();

	private final ConsolePrompter prompter = new ConsolePrompter(console);

	@Test
	void choiceReturnsDefaultWhenInputIsEmpty() {
		console.type("");

		assertThat(prompter.choice(QUESTION, MODES, 0)).isZero();
	}

	@Test
	void choiceReturnsIndexWhenNumberIsTyped() {
		console.type(" 2 ");

		assertThat(prompter.choice(QUESTION, MODES, 0)).isEqualTo(1);
	}

	@Test
	void choicePrintsNumberedOptionsAndDefaultBeforeThePrompt() {
		console.type("");

		prompter.choice(QUESTION, MODES, 1);

		assertThat(console.output()).containsSubsequence("  " + QUESTION,
				"    1) Self-host    one company, one database", "    2) Cloud        many tenants", "  Choice [2]: ");
	}

	@Test
	void choiceAsksAgainWhenNumberIsOutOfRange() {
		console.type("7", "1");

		assertThat(prompter.choice(QUESTION, MODES, 0)).isZero();
		assertThat(console.output()).containsOnlyOnce(RANGE_MESSAGE);
		assertThat(count(PROMPT)).isEqualTo(2);
	}

	@Test
	void choiceAsksAgainWhenInputIsNotANumber() {
		console.type("abc", "2");

		assertThat(prompter.choice(QUESTION, MODES, 0)).isEqualTo(1);
		assertThat(console.output()).containsOnlyOnce(RANGE_MESSAGE);
	}

	@Test
	void choicePrintsHelpWhenInputIsQuestionMark() {
		console.type("?", "");

		assertThat(prompter.choice(QUESTION, MODES, 0)).isZero();
		assertThat(console.output()).contains("Self-host: Help for self-host.").contains("Cloud: Help for cloud.")
				.doesNotContain("Please enter");
		assertThat(count(PROMPT)).isEqualTo(2);
	}

	@Test
	void choiceThrowsSetupCancelledWhenInputIsQ() {
		console.type("Q");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> prompter.choice(QUESTION, MODES, 0))
				.withMessage("Setup cancelled. Nothing was written.");
	}

	@Test
	void choiceThrowsSetupCancelledWhenInputEnds() {
		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> prompter.choice(QUESTION, MODES, 0));
	}

	@Test
	void choiceRejectsDefaultOutsideTheOptions() {
		assertThatIllegalArgumentException().isThrownBy(() -> prompter.choice(QUESTION, MODES, 2));
	}

	@Test
	void printWritesTheLineAsItIs() {
		prompter.print("  hello");

		assertThat(console.output()).isEqualTo("  hello" + System.lineSeparator());
	}

	private int count(String text) {
		String output = console.output();
		int count = 0;
		for (int at = output.indexOf(text); at >= 0; at = output.indexOf(text, at + text.length())) {
			count++;
		}
		return count;
	}

}
