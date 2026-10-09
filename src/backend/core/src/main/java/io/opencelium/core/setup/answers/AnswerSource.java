package io.opencelium.core.setup.answers;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Where a step gets its answer. A value from the answers file is checked with the step's own rules, printed with
 * its origin, and taken without a question; a bad value stops the setup, because the file is wrong and must be
 * fixed. A value the file does not have is asked through the prompter. In non-interactive mode nothing is asked:
 * an absent value stops the setup naming the key and the file, and the confirmation takes its default.
 */
public final class AnswerSource {

	/** No answers file and a terminal: every question is asked. */
	public static final AnswerSource PROMPTED = new AnswerSource(Answers.NONE, Optional.empty(), false);

	private static final String FILE_REMARK = "from the answers file";

	private static final String NON_INTERACTIVE_REMARK = "non-interactive";

	private final Answers answers;

	private final Optional<Path> file;

	private final boolean nonInteractive;

	/**
	 * @param file           the answers file, for the messages; empty when none was given
	 * @param nonInteractive never ask: {@code --non-interactive}, or no terminal
	 */
	public AnswerSource(Answers answers, Optional<Path> file, boolean nonInteractive) {
		this.answers = Objects.requireNonNull(answers, "answers");
		this.file = Objects.requireNonNull(file, "file");
		this.nonInteractive = nonInteractive;
	}

	public boolean nonInteractive() {
		return nonInteractive;
	}

	/**
	 * The answer for {@code key}: from the file, else from the prompter; the arguments after the key are those of
	 * {@link Prompter#text}.
	 *
	 * @throws SetupFailedException when the file's value is rejected by the validator, or when the value is absent
	 *                              in non-interactive mode
	 */
	public String text(AnswerKey key, String question, String help, String defaultValue,
			Function<String, Optional<String>> validator, Prompter prompter) {
		Optional<String> given = answers.get(key);
		if (given.isPresent()) {
			String value = given.get();
			Optional<String> problem = validator.apply(value);
			if (problem.isPresent()) {
				throw SetupFailedException.failure("Bad answer: " + key.word() + inFile() + ": " + problem.get());
			}
			prompter.answered(question, value, FILE_REMARK);
			return value;
		}
		if (nonInteractive) {
			throw SetupFailedException.failure("Missing answer: " + key.word() + inFile());
		}
		return prompter.text(question, help, defaultValue, validator);
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
