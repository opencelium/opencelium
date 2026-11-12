package io.opencelium.core.setup.prompt;

import java.util.LinkedHashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The rule, the framed box and the bulleted list of the setup screens, drawn with plain characters. */
class ScreenTest {

	@Test
	void ruleFillsTheWidthFromTheMargin() {
		assertThat(Screen.rule()).isEqualTo("  " + "-".repeat(74));
	}

	@Test
	void boxFramesTheRowsWithTheTitleInTheTopLineAndAlignsTheValues() {
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", "self-host");
		rows.put("Data directory", "/srv/oc");
		rows.put("Web port", "9090");

		List<String> box = Screen.box("Summary", rows);

		assertThat(box).containsExactly(
				"  +-- Summary " + "-".repeat(61) + "+",
				"  |" + " ".repeat(72) + "|",
				"  |  Mode            self-host" + " ".repeat(45) + "|",
				"  |  Data directory  /srv/oc" + " ".repeat(47) + "|",
				"  |  Web port        9090" + " ".repeat(50) + "|",
				"  |" + " ".repeat(72) + "|",
				"  +" + "-".repeat(72) + "+");
		assertThat(box).allSatisfy(line -> assertThat(line).hasSize(Screen.WIDTH));
	}

	@Test
	void boxGrowsWithTheLongestRow() {
		var rows = new LinkedHashMap<String, String>();
		String value = "/".repeat(70);
		rows.put("Data directory", value);

		List<String> box = Screen.box("Summary", rows);

		assertThat(box).allSatisfy(line -> assertThat(line).hasSize(2 + 1 + 2 + 16 + 70 + 2 + 1));
		assertThat(box.get(2)).isEqualTo("  |  Data directory  " + value + "  |");
	}

	@Test
	void listIndentsTheItemsUnderTheTitleWithBullets() {
		assertThat(Screen.list("Files to write", List.of("a.yml", "b.env")))
				.containsExactly("  Files to write", "    - a.yml", "    - b.env");
	}

	@Test
	void printableReplacesEachControlCharacterWithAQuestionMark() {
		assertThat(Screen.printable("a\u0000b\u001Bc\u001Fd\u007Fe\u0080f\u009Fg\th\ri\nj"))
				.isEqualTo("a?b?c?d?e?f?g?h?i?j");
	}

	@Test
	void printableKeepsPlainAndNonAsciiTextUnchanged() {
		String text = "Gr\u00F6\u00DFe: 10 \u20AC [ok]\u00A0~/oc/data";

		assertThat(Screen.printable(text)).isEqualTo(text);
		assertThat(Screen.printable("")).isEmpty();
	}

}
