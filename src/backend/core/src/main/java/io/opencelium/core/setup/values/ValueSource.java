package io.opencelium.core.setup.values;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Where a step gets its value. A value from the setup file is checked with the step's own rules, printed with the
 * file it came from, and taken without a question; a bad value stops the setup, because the file is wrong and must be
 * fixed. A value the file does not have is asked through the prompter. In non-interactive mode nothing is asked:
 * an absent value stops the setup naming the key and the file, and the confirmation takes its default.
 */
public final class ValueSource {

	/** No setup file and a terminal: every question is asked. */
	public static final ValueSource PROMPTED = new ValueSource(SetupValues.NONE, Optional.empty(), false);

	private static final String NON_INTERACTIVE_REMARK = "non-interactive";

	private final SetupValues values;

	private final Optional<Path> file;

	private final boolean nonInteractive;

	/**
	 * @param file           the setup file, for the messages; empty when none was given
	 * @param nonInteractive never ask: {@code --non-interactive}, or no terminal
	 */
	public ValueSource(SetupValues values, Optional<Path> file, boolean nonInteractive) {
		this.values = Objects.requireNonNull(values, "values");
		this.file = Objects.requireNonNull(file, "file");
		this.nonInteractive = nonInteractive;
	}

	public boolean nonInteractive() {
		return nonInteractive;
	}

	/**
	 * The value of a question: from the file, else from the prompter. The validator is the one the prompt would use.
	 *
	 * @throws SetupFailedException when the file's value is rejected by the validator, or when the value is absent
	 *                              in non-interactive mode
	 */
	public String text(Question question, Function<String, Optional<String>> validator, Prompter prompter) {
		String key = question.key().word();
		Optional<String> given = values.get(question.key());
		if (given.isPresent()) {
			String value = given.get();
			Optional<String> problem = validator.apply(value);
			if (problem.isPresent()) {
				throw SetupFailedException.failure("Bad value: " + key + inFile() + ": " + problem.get());
			}
			prompter.answered(question.label(), value, "from " + file.map(Path::toString).orElse("the setup file"));
			return value;
		}
		if (nonInteractive) {
			throw SetupFailedException.failure("Missing value: " + key + inFile() + "\n" + SetupFile.TEMPLATE_HINT);
		}
		return prompter.text(question.label(), question.help(), question.defaultValue(), validator);
	}

	/** The confirmation: asked on a terminal; in non-interactive mode the default, printed as such. */
	public boolean yesNo(String question, String help, boolean defaultYes, Prompter prompter) {
		if (nonInteractive) {
			prompter.answered(question, defaultYes ? "yes" : "no", NON_INTERACTIVE_REMARK);
			return defaultYes;
		}
		return prompter.yesNo(question, help, defaultYes);
	}

	private String inFile() {
		return file.map(path -> " in " + path).orElse("");
	}

}
