package io.opencelium.core.setup.values;

import java.nio.file.Path;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.UnaryOperator;

import io.opencelium.core.setup.SetupFailedException;
import io.opencelium.core.setup.prompt.Prompter;

/**
 * Where a step gets its value. A value from the environment comes first: the start reads the same variable, so the
 * setup takes its value without a question and writes no copy of it. A bad value from the environment stops the
 * setup, also on a terminal, because each start reads the variable again; a setup file value for the same question
 * must agree with it. A value from the setup file is checked with the step's own rules, printed with the file it came
 * from, and taken without a question; a bad value stops the setup, because the file is wrong and must be fixed. A
 * value that neither gives is asked through the prompter. In batch mode nothing is asked: an absent value stops the
 * setup naming the key and the file, and the confirmation takes its default.
 */
public final class ValueSource {

	/** No setup file, no value from the environment, and a terminal: every question is asked. */
	public static final ValueSource PROMPTED = new ValueSource(SetupValues.NONE, Optional.empty(), false);

	private static final String BATCH_REMARK = "batch";

	private final SetupValues values;

	private final Optional<Path> file;

	private final boolean batch;

	private final EnvironmentSnapshot environment;

	/**
	 * No value from the environment.
	 *
	 * @param file           the setup file, for the messages; empty when none was given
	 * @param batch never ask: {@code --batch}, or no terminal
	 */
	public ValueSource(SetupValues values, Optional<Path> file, boolean batch) {
		this(values, file, batch, EnvironmentSnapshot.NONE);
	}

	/**
	 * @param file        the setup file, for the messages; empty when none was given
	 * @param batch       never ask: {@code --batch}, or no terminal
	 * @param environment the bootstrap values of the environment variables; they come before the setup file
	 */
	public ValueSource(SetupValues values, Optional<Path> file, boolean batch, EnvironmentSnapshot environment) {
		this.values = Objects.requireNonNull(values, "values");
		this.file = Objects.requireNonNull(file, "file");
		this.batch = batch;
		this.environment = Objects.requireNonNull(environment, "environment");
	}

	public boolean batch() {
		return batch;
	}

	/** The bootstrap values of the environment variables of the setup. */
	public EnvironmentSnapshot environment() {
		return environment;
	}

	/**
	 * The value of a question: from the environment, else from the file, else from the prompter. The validator is
	 * the one the prompt would use. A value from both the environment and the file must be the same text.
	 *
	 * @throws SetupFailedException when the value from the environment or from the file is rejected by the
	 *                              validator, when the two differ, or when the value is absent in batch mode
	 */
	public String text(Question question, Function<String, Optional<String>> validator, Prompter prompter) {
		return text(question, validator, Function.identity(), prompter);
	}

	/**
	 * The value of a question: from the environment, else from the file, else from the prompter. The validator is
	 * the one the prompt would use. The environment gives a value when the key of the question names a bootstrap
	 * property and a variable gives that property.
	 *
	 * @param value the value of a text that the validator accepts, for example the port as a number or a path as an
	 *              absolute path; the setup file and the environment agree when they give equal values
	 * @throws SetupFailedException when the value from the environment or from the file is rejected by the
	 *                              validator, when the two give different values, or when the value is absent in
	 *                              batch mode
	 */
	public String text(Question question, Function<String, Optional<String>> validator, Function<String, ?> value,
			Prompter prompter) {
		Optional<EnvironmentSnapshot.Value> fromEnvironment = question.key().property().flatMap(environment::value);
		if (fromEnvironment.isPresent()) {
			return fromEnvironment(question, fromEnvironment.get(), validator, value, prompter);
		}
		return given(question, validator, UnaryOperator.identity(), prompter)
				.orElseGet(() -> prompter.text(question.label(), question.help(), question.defaultValue(), validator));
	}

	/**
	 * The value of a variable, after the check of a typed answer and the comparison with the setup file. The messages
	 * name the variable, the key and the file, and quote no value of the comparison.
	 */
	private String fromEnvironment(Question question, EnvironmentSnapshot.Value variable,
			Function<String, Optional<String>> validator, Function<String, ?> value, Prompter prompter) {
		String name = variable.variable();
		Optional<String> problem = validator.apply(variable.text());
		if (problem.isPresent()) {
			throw SetupFailedException.failure("Bad value: " + name + " in the environment: " + problem.get(),
					"Repair the value of " + name + ", or remove the variable. Each start reads it, so the setup does"
							+ " not ask again.");
		}
		String key = question.key().word();
		Optional<String> fromFile = values.get(question.key());
		if (fromFile.isPresent()) {
			Optional<String> fileProblem = validator.apply(fromFile.get());
			if (fileProblem.isPresent()) {
				throw SetupFailedException.failure("Bad value: " + key + inFile() + ": " + fileProblem.get());
			}
			if (!value.apply(fromFile.get()).equals(value.apply(variable.text()))) {
				throw SetupFailedException.failure("Different values: " + key + inFile() + " and the variable " + name
						+ ".", "Remove one of them, or give both the same value.");
			}
		}
		prompter.answered(question.label(), variable.text(), "from the environment: " + name);
		return variable.text();
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
