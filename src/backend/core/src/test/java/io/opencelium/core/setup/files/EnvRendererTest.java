package io.opencelium.core.setup.files;

import java.util.LinkedHashMap;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The text of the env file: a fixed comment line, then one {@code KEY=value} line for each entry in order, as
 * systemd's {@code EnvironmentFile} reads it. A value with whitespace is quoted; an empty map gives the comment only.
 */
class EnvRendererTest {

	@Test
	void renderWritesKeyEqualsValueForEachLine() {
		var values = new LinkedHashMap<String, String>();
		values.put("OC_MONGO_PASSWORD", "s3cret");
		values.put("OC_OTHER", "plain-value");

		assertThat(EnvRenderer.render(values)).isEqualTo("""
				# Written by OpenCelium setup. One KEY=value for each line; application.yml refers to these names.
				OC_MONGO_PASSWORD=s3cret
				OC_OTHER=plain-value
				""");
	}

	@Test
	void renderQuotesValuesWithSpaces() {
		var values = new LinkedHashMap<String, String>();
		values.put("OC_A", "two words");
		values.put("OC_B", "say \"hi\" \\ there");

		assertThat(EnvRenderer.render(values)).contains("OC_A=\"two words\"\n")
				.contains("OC_B=\"say \\\"hi\\\" \\\\ there\"\n");
	}

	@Test
	void renderWritesCommentOnlyWhenEmpty() {
		assertThat(EnvRenderer.render(new LinkedHashMap<>())).isEqualTo(
				"# Written by OpenCelium setup. One KEY=value for each line; application.yml refers to these names.\n");
	}

}
