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

}
