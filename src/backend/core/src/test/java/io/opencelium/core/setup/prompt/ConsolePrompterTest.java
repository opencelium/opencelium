package io.opencelium.core.setup.prompt;

import java.util.List;
import java.util.Optional;
import java.util.function.Function;

import org.junit.jupiter.api.Test;

import io.opencelium.core.setup.SetupCancelledException;
import io.opencelium.core.testsupport.fake.ScriptedConsoleIo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

/**
 * The prompts on a console: Enter takes the default, anything the prompt cannot accept is explained and asked
 * again, {@code ?} prints the help text, and {@code q} or the end of the input cancels the setup. Bad input never
 * ends the wizard.
 */
class ConsolePrompterTest {

	private static final List<Choice> MODES = List.of(
			new Choice("Self-host", "one company, one database", "Help for self-host."),
			new Choice("Cloud", "many tenants", "Help for cloud."));

	private static final String QUESTION = "How will this OpenCelium run?";

	private static final String PROMPT = "  Choice [1]: ";

	private static final String RANGE_MESSAGE = "  Please enter a number between 1 and 2.";

	private static final String DIR_QUESTION = "Data directory";

	private static final String DIR_PROMPT = "  Data directory [/srv/oc]: ";

	private static final Function<String, Optional<String>> NO_SPACES = value -> value.contains(" ")
			? Optional.of("No spaces, please.") : Optional.empty();

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
	void textReturnsDefaultWhenInputIsEmpty() {
		console.type("");

		assertThat(prompter.text(DIR_QUESTION, "Help.", "/srv/oc", NO_SPACES)).isEqualTo("/srv/oc");
		assertThat(console.output()).contains(DIR_PROMPT);
	}

	@Test
	void textReturnsTypedValueStripped() {
		console.type("  /data/oc  ");

		assertThat(prompter.text(DIR_QUESTION, "Help.", "/srv/oc", NO_SPACES)).isEqualTo("/data/oc");
	}

	@Test
	void textAsksAgainWhenValidatorRejects() {
		console.type("/with space", "/ok");

		assertThat(prompter.text(DIR_QUESTION, "Help.", "/srv/oc", NO_SPACES)).isEqualTo("/ok");
		assertThat(console.output()).containsOnlyOnce("  No spaces, please.");
		assertThat(count(DIR_PROMPT)).isEqualTo(2);
	}

	@Test
	void textValidatesTheDefaultToo() {
		console.type("", "/ok");

		assertThat(prompter.text(DIR_QUESTION, "Help.", "/bad default", NO_SPACES)).isEqualTo("/ok");
		assertThat(console.output()).containsOnlyOnce("  No spaces, please.");
	}

	@Test
	void textPrintsHelpWhenInputIsQuestionMark() {
		console.type("?", "");

		assertThat(prompter.text(DIR_QUESTION, "Where the data goes.", "/srv/oc", NO_SPACES)).isEqualTo("/srv/oc");
		assertThat(console.output()).contains("  Where the data goes.");
		assertThat(count(DIR_PROMPT)).isEqualTo(2);
	}

	@Test
	void textThrowsSetupCancelledWhenInputIsQ() {
		console.type("q");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> prompter.text(DIR_QUESTION, "Help.", "/srv/oc", NO_SPACES));
	}

	@Test
	void yesNoReturnsDefaultWhenInputIsEmpty() {
		console.type("");

		assertThat(prompter.yesNo("Write the files?", "help", true)).isTrue();
		assertThat(console.output()).isEqualTo("  Write the files? [Y/n]: ");
	}

	@Test
	void yesNoShowsNoAsDefaultInBrackets() {
		console.type("");

		assertThat(prompter.yesNo("Write the files?", "help", false)).isFalse();
		assertThat(console.output()).isEqualTo("  Write the files? [y/N]: ");
	}

	@Test
	void yesNoAcceptsYesAndNoInAnyCaseAndLength() {
		console.type("Y", "no", " yes ", "N");

		assertThat(prompter.yesNo("Write?", "help", false)).isTrue();
		assertThat(prompter.yesNo("Write?", "help", true)).isFalse();
		assertThat(prompter.yesNo("Write?", "help", false)).isTrue();
		assertThat(prompter.yesNo("Write?", "help", true)).isFalse();
	}

	@Test
	void yesNoAsksAgainWhenInputIsNeither() {
		console.type("maybe", "y");

		assertThat(prompter.yesNo("Write?", "help", true)).isTrue();
		// The scripted console does not echo the input, so the message follows the prompt on the same line.
		assertThat(console.output()).isEqualTo("  Write? [Y/n]:   Please answer y or n.\n  Write? [Y/n]: ");
	}

	@Test
	void yesNoPrintsHelpWhenInputIsQuestionMark() {
		console.type("?", "n");

		assertThat(prompter.yesNo("Write?", "y writes the files.\nn ends the setup.", true)).isFalse();
		assertThat(console.output()).contains("  y writes the files.\n  n ends the setup.\n  Write? [Y/n]: ");
	}

	@Test
	void yesNoThrowsSetupCancelledWhenInputIsQ() {
		console.type("q");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> prompter.yesNo("Write?", "help", true));
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
