package io.opencelium.core.setup.prompt;

import java.util.LinkedHashMap;
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
 * ends the wizard. The layout, in plain characters: a question is its label padded to one column, the default in
 * brackets, and a colon; a problem starts with {@code !}; help is indented under the question. A progress bar
 * changes in its line on a terminal; in a log file it prints 1 line when the progress passes a quarter.
 */
class ConsolePrompterTest {

	private static final List<Choice> MODES = List.of(
			new Choice("Self-host", "one company, one database", "Help for self-host."),
			new Choice("Cloud", "many tenants", "Help for cloud."));

	private static final String QUESTION = "How will this OpenCelium run?";

	private static final String PROMPT = "  Choice [1]: ";

	private static final String RANGE_MESSAGE = "  ! Please enter a number between 1 and 2.";

	private static final String DIR_QUESTION = "Data directory";

	private static final String DIR_PROMPT = "  Data directory  [/srv/oc]: ";

	/** A short label is padded to the label column. */
	private static final String WRITE_PROMPT = "  Write?" + " ".repeat(10) + "[Y/n]: ";

	private static final String DOWNLOAD = "Downloading the image mongo:8";

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
		assertThat(console.output()).containsOnlyOnce("  ! No spaces, please.");
		assertThat(count(DIR_PROMPT)).isEqualTo(2);
	}

	@Test
	void textValidatesTheDefaultToo() {
		console.type("", "/ok");

		assertThat(prompter.text(DIR_QUESTION, "Help.", "/bad default", NO_SPACES)).isEqualTo("/ok");
		assertThat(console.output()).containsOnlyOnce("  ! No spaces, please.");
	}

	@Test
	void textPrintsHelpWhenInputIsQuestionMark() {
		console.type("?", "");

		assertThat(prompter.text(DIR_QUESTION, "Where the data goes.", "/srv/oc", NO_SPACES)).isEqualTo("/srv/oc");
		assertThat(console.output()).contains("    Where the data goes.");
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
		assertThat(console.output()).isEqualTo(WRITE_PROMPT + "  ! Please answer y or n.\n" + WRITE_PROMPT);
	}

	@Test
	void yesNoPrintsHelpWhenInputIsQuestionMark() {
		console.type("?", "n");

		assertThat(prompter.yesNo("Write?", "y writes the files.\nn ends the setup.", true)).isFalse();
		assertThat(console.output()).contains("    y writes the files.\n    n ends the setup.\n" + WRITE_PROMPT);
	}

	@Test
	void yesNoThrowsSetupCancelledWhenInputIsQ() {
		console.type("q");

		assertThatExceptionOfType(SetupCancelledException.class)
				.isThrownBy(() -> prompter.yesNo("Write?", "help", true));
	}

	@Test
	void textPadsAShortLabelToTheLabelColumn() {
		console.type("");

		prompter.text("Web port", "Help.", "9090", NO_SPACES);

		assertThat(console.output()).isEqualTo("  Web port" + " ".repeat(8) + "[9090]: ");
	}

	@Test
	void answeredPrintsTheLabelTheValueAndTheRemark() {
		prompter.answered("Data directory", "./data", "from setup-values.yml");

		assertThat(console.output()).isEqualTo("  Data directory  ./data   (from setup-values.yml)\n");
	}

	@Test
	void titlePrintsTheTitleOverARule() {
		prompter.title("OpenCelium setup");

		assertThat(console.output()).isEqualTo("  OpenCelium setup\n  " + "-".repeat(74) + "\n");
	}

	@Test
	void statusLinesStartWithTheirMarkAndIndentTheContinuation() {
		prompter.info("No configuration was found.", "Press Enter to accept.");
		prompter.error("Cannot write x.", "Nothing was written.");
		prompter.success("Configuration written.");
		prompter.progress("Starting OpenCelium...");

		assertThat(console.output()).isEqualTo("""
				  No configuration was found.
				  Press Enter to accept.
				  ! Cannot write x.
				    Nothing was written.
				  OK Configuration written.
				  -> Starting OpenCelium...
				""");
	}

	@Test
	void boxAndListDrawTheFrameAndTheBullets() {
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", "self-host");

		prompter.box("Summary", rows);
		prompter.list("Files to write", List.of("a.yml", "b.env"));

		assertThat(console.output()).containsSubsequence("  +-- Summary --", "  |  Mode" + " ".repeat(12) + "self-host",
				"  +--", "  Files to write", "    - a.yml", "    - b.env");
	}

	@Test
	void everyScreenUsesPlainCharactersOnly() {
		console.type("", "");
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", "self-host");

		prompter.title("OpenCelium setup");
		prompter.info("Hello.");
		prompter.error("Failed.", "Nothing was written.");
		prompter.success("Done.");
		prompter.progress("Starting.");
		prompter.box("Summary", rows);
		prompter.list("Files", List.of("a"));
		prompter.text(DIR_QUESTION, "Help.", "/srv/oc", NO_SPACES);
		prompter.yesNo("Write?", "Help.", true);
		try (Prompter.Meter meter = prompter.meter("Downloading.")) {
			meter.update(1, 2);
		}

		assertThat(console.output().chars()).allMatch(c -> c < 128);
	}

	@Test
	void printWritesTheLineAsItIs() {
		prompter.print("  hello");

		assertThat(console.output()).isEqualTo("  hello" + System.lineSeparator());
	}

	@Test
	void meterDrawsTheBarAgainInOneLineWhenConsoleIsATerminal() {
		console.asTerminal();

		try (Prompter.Meter meter = prompter.meter(DOWNLOAD)) {
			meter.update(0, 0);
			meter.update(5_000_000, 20_000_000);
			// 99.506 %: the bar, the percent and the MB round down; only the end shows a full bar, the total and 100 %.
			meter.update(995_060_000, 1_000_000_000);
			meter.update(1_000_000_000, 1_000_000_000);
			// A layer gives its size late: the bar moves back, and spaces cover the end of the longer text before it.
			meter.update(1_000_000_000, 1_200_000_000);
		}

		assertThat(console.output()).isEqualTo("  -> " + DOWNLOAD + "\n"
				+ "\r    [######------------------]  5.0 of 20.0 MB  25%"
				+ "\r    [#######################-]  995.0 of 1000.0 MB  99%"
				+ "\r    [########################]  1000.0 of 1000.0 MB  100%"
				+ "\r    [####################----]  1000.0 of 1200.0 MB  83% "
				+ "\n");
	}

	@Test
	void meterPrintsOneLineAtEachQuarterWhenConsoleIsNoTerminal() {
		try (Prompter.Meter meter = prompter.meter(DOWNLOAD)) {
			meter.update(10_000_000, 100_000_000);
			meter.update(30_000_000, 100_000_000);
			// The total grows: the bar moves back under 25 % and passes it again; the 25 % line does not come again.
			meter.update(30_000_000, 200_000_000);
			meter.update(60_000_000, 200_000_000);
			// 1 update passes 50 % and 75 %: 1 line.
			meter.update(160_000_000, 200_000_000);
			meter.update(170_000_000, 200_000_000);
			meter.update(200_000_000, 200_000_000);
		}

		assertThat(console.output()).isEqualTo("""
				  -> Downloading the image mongo:8
				    [#######-----------------]  30.0 of 100.0 MB  30%
				    [###################-----]  160.0 of 200.0 MB  80%
				    [########################]  200.0 of 200.0 MB  100%
				""");
	}

	@Test
	void meterEndsWithTheEndStateWhenTheTotalGrowsAfterTheLastLine() {
		try (Prompter.Meter meter = prompter.meter(DOWNLOAD)) {
			// The first layers are complete before the large layer gives its size.
			meter.update(10_000_000, 10_000_000);
			meter.update(10_000_000, 300_000_000);
			meter.update(300_000_000, 300_000_000);
		}

		assertThat(console.output()).isEqualTo("""
				  -> Downloading the image mongo:8
				    [########################]  10.0 of 10.0 MB  100%
				    [########################]  300.0 of 300.0 MB  100%
				""");
	}

	@Test
	void meterPrintsNothingWhenTheTotalStaysZero() {
		console.asTerminal();

		try (Prompter.Meter meter = prompter.meter(DOWNLOAD)) {
			meter.update(0, 0);
		}

		assertThat(console.output()).isEmpty();
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
