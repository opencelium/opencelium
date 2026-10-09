package io.opencelium.core.setup.values;

import java.util.List;

import io.opencelium.core.setup.steps.SetupStep;

/**
 * The template of the setup file, printed by {@code setup --template}: a header that says how to use the file,
 * then one block for each question of the given steps, with the help text as comment lines and
 * {@code key: default}. The defaults are those of the machine that prints the template, so the file is ready to
 * use as it is, and it loads back to exactly the values it shows.
 */
public final class SetupFileTemplate {

	static final String HEADER = """
			# OpenCelium setup file. Run: java -jar oc-app.jar setup --file <this file>
			# Every value below is the default of this machine. Remove a line, and the wizard
			# asks for it; with --non-interactive every key is required.
			""";

	private SetupFileTemplate() {
	}

	public static String render(List<SetupStep> steps) {
		var text = new StringBuilder(HEADER);
		for (SetupStep step : steps) {
			step.question().ifPresent(question -> {
				text.append('\n');
				question.help().lines().forEach(line -> text.append("# ").append(line).append('\n'));
				text.append(SetupFile.line(question.key(), question.defaultValue()));
			});
		}
		return text.toString();
	}

}
