package io.opencelium.core.setup.values;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import io.opencelium.core.setup.steps.SetupStep;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The template of the setup file: a header that says how to use it, then one block for each question with the help
 * as comment lines and {@code key: default}. A step without a question adds nothing. The template loads back as a
 * setup file with exactly the defaults it shows, also when a default needs YAML quoting.
 */
class SetupFileTemplateTest {

	@TempDir
	Path tmp;

	@Test
	void renderStartsWithTheHeaderThatSaysHowToUseTheFile() {
		String template = SetupFileTemplate.render(List.of());

		assertThat(template).isEqualTo("""
				# OpenCelium setup file. Run: java -jar oc-app.jar setup --file <this file>
				# Every value below is the default of this machine. Remove a line, and the wizard
				# asks for it; with --batch every key is required.
				""");
	}

	@Test
	void renderWritesOneBlockPerQuestionWithTheHelpAsCommentsAndTheDefault() {
		SetupStep dataDir = asking(new Question(ValueKey.DATA_DIR, "Data directory",
				"Where the state lives.\nMust be writable.", "/srv/oc/data"));
		SetupStep port = asking(new Question(ValueKey.PORT, "Web port", "The HTTP port.", "9090"));

		String template = SetupFileTemplate.render(List.of(dataDir, summary(), port));

		assertThat(template).endsWith("""

				# Where the state lives.
				# Must be writable.
				data-dir: /srv/oc/data

				# The HTTP port.
				port: 9090
				""");
	}

	@Test
	void renderedTemplateLoadsBackToItsDefaults() throws IOException {
		SetupStep dataDir = asking(new Question(ValueKey.DATA_DIR, "Data directory", "Help.", "/srv/oc #1: data"));
		SetupStep port = asking(new Question(ValueKey.PORT, "Web port", "Help.", "010"));
		Path file = Files.writeString(tmp.resolve("setup-values.yml"),
				SetupFileTemplate.render(List.of(dataDir, port)));

		SetupValues values = SetupFile.load(file);

		assertThat(values.get(ValueKey.DATA_DIR)).contains("/srv/oc #1: data");
		assertThat(values.get(ValueKey.PORT)).contains("010");
	}

	private static SetupStep asking(Question question) {
		return new SetupStep() {
			@Override
			public Optional<Question> question() {
				return Optional.of(question);
			}

			@Override
			public void run(io.opencelium.core.setup.SetupContext context,
					io.opencelium.core.setup.prompt.Prompter prompter) {
				throw new UnsupportedOperationException("the template does not run a step");
			}
		};
	}

	private static SetupStep summary() {
		return (context, prompter) -> {
			throw new UnsupportedOperationException("the template does not run a step");
		};
	}

}
