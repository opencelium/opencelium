package io.opencelium.core.setup.values;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;

import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Where a step gets its value. A value from the setup file is checked with the step's own rules, printed with the
 * file it came from, and taken without a question; a bad value stops the setup, because the file is wrong and must be
 * fixed. A value the file does not have is asked through the prompter. In batch mode nothing is asked:
 * an absent value stops the setup naming the key and the file, and the confirmation takes its default.
 */
public final class ValueSource {

	/** No setup file and a terminal: every question is asked. */
	public static final ValueSource PROMPTED = new ValueSource(SetupValues.NONE, Optional.empty(), false);

	private static final String BATCH_REMARK = "batch";

	private final SetupValues values;

	private final Optional<Path> file;

	private final boolean batch;

	/**
	 * @param file           the setup file, for the messages; empty when none was given
	 * @param batch never ask: {@code --batch}, or no terminal
	 */
	public ValueSource(SetupValues values, Optional<Path> file, boolean batch) {
		this.values = Objects.requireNonNull(values, "values");
		this.file = Objects.requireNonNull(file, "file");
		this.batch = batch;
	}

	public boolean batch() {
		return batch;
	}

	/**
	 * The value of a question: from the file, else from the prompter. The validator is the one the prompt would use.
	 *
	 * @throws SetupFailedException when the file's value is rejected by the validator, or when the value is absent
	 *                              in batch mode
	 */
	public String text(Question question, Function<String, Optional<String>> validator, Prompter prompter) {
		return given(question, validator, UnaryOperator.identity(), prompter)
				.orElseGet(() -> prompter.text(question.label(), question.help(), question.defaultValue(), validator));
	}

	/**
	 * The setup file's value of a question that the step asks itself, for example as a menu: checked with the
	 * step's own rules, printed with the file it came from, and taken without a question.
	 *
	 * @param shown how the value is printed, for example without the password that it holds
	 * @return empty when the file does not have the value and a terminal can ask it
	 * @throws SetupFailedException when the file's value is rejected by the validator, or when the value is absent
	 *                              in batch mode
	 */
	public Optional<String> given(Question question, Function<String, Optional<String>> validator,
			UnaryOperator<String> shown, Prompter prompter) {
		String key = question.key().word();
		Optional<String> given = values.get(question.key());
		if (given.isPresent()) {
			String value = given.get();
			Optional<String> problem = validator.apply(value);
			if (problem.isPresent()) {
				throw SetupFailedException.failure("Bad value: " + key + inFile() + ": " + problem.get());
			}
			prompter.answered(question.label(), shown.apply(value), "from " + file.map(Path::toString)
					.orElse("the setup file"));
			return given;
		}
		if (batch) {
			throw SetupFailedException.failure("Missing value: " + key + inFile(), SetupFile.TEMPLATE_HINT);
		}
		return Optional.empty();
	}

	/** The confirmation: asked on a terminal; in batch mode the default, printed as such. */
	public boolean yesNo(String question, String help, boolean defaultYes, Prompter prompter) {
		if (batch) {
			prompter.answered(question, defaultYes ? "yes" : "no", BATCH_REMARK);
			return defaultYes;
		}
		return prompter.yesNo(question, help, defaultYes);
	}

	private String inFile() {
		return file.map(path -> " in " + path).orElse("");
	}

}
