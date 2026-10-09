package io.opencelium.core.setup.prompt;

import java.util.LinkedHashMap;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The section rule and the two-column table of the setup screens. */
class ScreenTest {

	@Test
	void sectionRuleCarriesTheTitleAndHasTheFixedWidth() {
		assertThat(Screen.section("Summary")).startsWith("── Summary ──").hasSize(Screen.WIDTH);
	}

	@Test
	void sectionRuleIsNotCutWhenTheTitleIsLong() {
		String title = "x".repeat(Screen.WIDTH);

		assertThat(Screen.section(title)).contains(title);
	}

	@Test
	void tableAlignsTheValuesAfterTheLongestLabel() {
		var rows = new LinkedHashMap<String, String>();
		rows.put("Mode", "self-host");
		rows.put("Data directory", "/srv/oc");
		rows.put("Port", "9090");

		assertThat(Screen.table(rows)).containsExactly("  Mode" + " ".repeat(12) + "self-host",
				"  Data directory  /srv/oc", "  Port" + " ".repeat(12) + "9090");
	}

}
