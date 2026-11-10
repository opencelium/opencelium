package io.opencelium.core.setup.files;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.config.EnvFileReader;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

/**
 * The text of the env file: a fixed comment line, then one {@code KEY=value} line for each entry in order, as
 * systemd's {@code EnvironmentFile}, the shell and the start of the application read it. A value with whitespace or
 * shell syntax is quoted, with the escapes that all three readers apply; an empty map gives the comment only.
 */
class EnvRendererTest {

	@TempDir
	Path tmp;

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
	void renderQuotesTheUriWhenItHasOptions() {
		var values = new LinkedHashMap<String, String>();
		values.put("OC_MONGO_URI", "mongodb://oc:p%40ss@db.example:27017/opencelium?authSource=admin&tls=true");

		// The shell would read ? as a pattern and & as the end of a command.
		assertThat(EnvRenderer.render(values)).endsWith(
				"\nOC_MONGO_URI=\"mongodb://oc:p%40ss@db.example:27017/opencelium?authSource=admin&tls=true\"\n");
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
	void renderQuotesShellSyntaxAndEscapesWhatKeepsAMeaningInQuotes() {
		var values = new LinkedHashMap<String, String>();
		values.put("OC_A", "Abc&123");
		values.put("OC_B", "a$b`c");
		values.put("OC_C", "~home");

		assertThat(EnvRenderer.render(values)).contains("OC_A=\"Abc&123\"\n").contains("OC_B=\"a\\$b\\`c\"\n")
				.contains("OC_C=\"~home\"\n");
	}

	@Test
	void renderGivesTheWrittenValuesWhenTheShellLoadsTheFile() throws IOException, InterruptedException {
		Path shell = Path.of("/bin/sh");
		assumeTrue(Files.isExecutable(shell), "needs a POSIX shell at /bin/sh");
		List<String> written = List.of("Abc&123", "semi;colon|pipe", "a$(echo x)b", "back`tick`", "~tilde", "q\"uote",
				"back\\slash", "p#ss 'two' words", "brace${X}", "<in>(out)*?[]!");
		var values = new LinkedHashMap<String, String>();
		for (int i = 0; i < written.size(); i++) {
			values.put("OC_TEST_VALUE_" + i, written.get(i));
		}
		Path file = Files.writeString(tmp.resolve("opencelium.env"), EnvRenderer.render(values));
		// The start by hand: set -a; . ./config/opencelium.env; set +a
		String script = "set -a; . \"$1\"; set +a; " + values.keySet().stream()
				.map(name -> "printf '%s\\n' \"$" + name + "\"").reduce((a, b) -> a + "; " + b).orElseThrow();
		Process process = new ProcessBuilder(shell.toString(), "-c", script, "sh", file.toString())
				.redirectErrorStream(true).start();
		String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

		assertThat(process.waitFor()).isZero();
		assertThat(output.lines().toList()).containsExactlyElementsOf(written);
	}

	@Test
	void renderGivesTheSameEntriesWhenTheReaderReadsTheFile() throws IOException {
		List<String> written = List.of("s3cret", "", "Abc&123", "semi;colon|pipe", "a$(echo x)b", "back`tick`",
				"~tilde", "q\"uote", "back\\slash", "p#ss 'two' words", "brace${X}", "<in>(out)*?[]!", "tab\there",
				"ab==", "p%40ss@host:1/x");
		var values = new LinkedHashMap<String, String>();
		for (int i = 0; i < written.size(); i++) {
			values.put("OC_TEST_VALUE_" + i, written.get(i));
		}
		Path file = Files.writeString(tmp.resolve("opencelium.env"), EnvRenderer.render(values));

		assertThat(EnvFileReader.read(file)).containsExactlyEntriesOf(values);
	}

	@Test
	void renderWritesCommentOnlyWhenEmpty() {
		assertThat(EnvRenderer.render(new LinkedHashMap<>())).isEqualTo(
				"# Written by OpenCelium setup. One KEY=value for each line; application.yml refers to these names.\n");
	}

}
