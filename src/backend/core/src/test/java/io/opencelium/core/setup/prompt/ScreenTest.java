package io.opencelium.core.setup.prompt;

import java.util.LinkedHashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The rule, the framed box and the tree list of the setup screens, in both glyph sets. */
class ScreenTest {

	@Test
	void ruleHasTheFixedWidth() {
		assertThat(Screen.rule(Glyphs.UNICODE)).isEqualTo("─".repeat(76));
		assertThat(Screen.rule(Glyphs.ASCII)).isEqualTo("-".repeat(76));
	}

	@Test
	void boxFramesTheRowsWithTheTitleInTheTopLineAndAlignsTheValues() {
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", "self-host");
		rows.put("Data directory", "/srv/oc");
		rows.put("Web port", "9090");

		List<String> box = Screen.box(Glyphs.UNICODE, "Summary", rows);

		assertThat(box).containsExactly(
				"╭── Summary " + "─".repeat(47) + "╮",
				"│" + " ".repeat(58) + "│",
				"│  Mode            self-host" + " ".repeat(31) + "│",
				"│  Data directory  /srv/oc" + " ".repeat(33) + "│",
				"│  Web port        9090" + " ".repeat(36) + "│",
				"│" + " ".repeat(58) + "│",
				"╰" + "─".repeat(58) + "╯");
		assertThat(box).allSatisfy(line -> assertThat(line).hasSize(Screen.MIN_BOX_WIDTH));
	}

	@Test
	void boxGrowsWithTheLongestRow() {
		var rows = new LinkedHashMap<String, String>();
		String value = "/".repeat(70);
		rows.put("Data directory", value);

		List<String> box = Screen.box(Glyphs.UNICODE, "Summary", rows);

		assertThat(box).allSatisfy(line -> assertThat(line).hasSize(2 + 2 + 16 + 70 + 2));
		assertThat(box.get(2)).isEqualTo("│  Data directory  " + value + "  │");
	}

	@Test
	void boxInAsciiUsesPlusCornersAndBars() {
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", "self-host");

		List<String> box = Screen.box(Glyphs.ASCII, "Summary", rows);

		assertThat(box.getFirst()).isEqualTo("+-- Summary " + "-".repeat(47) + "+");
		assertThat(box.get(2)).startsWith("|  Mode            self-host").endsWith("|");
		assertThat(box.getLast()).isEqualTo("+" + "-".repeat(58) + "+");
	}

	@Test
	void treeIndentsTheTitleAndMarksTheLastItem() {
		assertThat(Screen.tree(Glyphs.UNICODE, "Files to write", List.of("a.yml", "b.env")))
				.containsExactly("   Files to write", "   ├─ a.yml", "   └─ b.env");
		assertThat(Screen.tree(Glyphs.ASCII, "Files to write", List.of("a.yml", "b.env")))
				.containsExactly("   Files to write", "   |- a.yml", "   `- b.env");
	}

}
