package io.opencelium.core.setup.answers;

import java.io.IOException;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;

import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import org.yaml.snakeyaml.error.MarkedYAMLException;
import org.yaml.snakeyaml.error.YAMLException;

import io.opencelium.core.setup.SetupFailedException;

/**
 * Reads the answers file: YAML with one {@code key: value} line for each question, for example
 * {@code data-dir: ./data} and {@code port: 9090}. A key without a value is the same as an absent key. An unknown
 * key is an error, so a typo cannot silently turn into a question; a value that is a list or a map is an error too.
 * The values are kept as text, and each step checks its value with the rules of the typed answer.
 */
public final class AnswersFile {

	private AnswersFile() {
	}

	/**
	 * @throws SetupFailedException with exit code 1 when the file is missing or broken, holds an unknown key, or
	 *                              holds a value that is not one value
	 */
	public static Answers load(Path file) {
		if (!Files.exists(file)) {
			throw SetupFailedException.failure("The answers file " + file + " does not exist.");
		}
		Object document;
		try (Reader reader = Files.newBufferedReader(file)) {
			document = new Yaml(new SafeConstructor(new LoaderOptions())).load(reader);
		}
		catch (IOException | YAMLException ex) {
			throw SetupFailedException.failure("The answers file " + file + " cannot be read: " + reason(ex));
		}
		if (document == null) {
			return Answers.NONE;
		}
		if (!(document instanceof Map<?, ?> entries)) {
			throw SetupFailedException.failure("The answers file " + file + " must hold key: value lines.");
		}
		Map<AnswerKey, String> values = new EnumMap<>(AnswerKey.class);
		for (Map.Entry<?, ?> entry : entries.entrySet()) {
			String word = String.valueOf(entry.getKey());
			AnswerKey key = AnswerKey.parse(word).orElseThrow(() -> SetupFailedException.failure(
					"Unknown key '" + word + "' in " + file + ". Known keys: " + AnswerKey.words() + "."));
			Object value = entry.getValue();
			if (value == null) {
				continue;
			}
			if (value instanceof Collection || value instanceof Map) {
				throw SetupFailedException.failure("Bad answer: " + key.word() + " in " + file
						+ ": one value is expected.");
			}
			values.put(key, String.valueOf(value));
		}
		return new Answers(values);
	}

	/** One line: the parser's problem with its line number when it has one, else the first line of the message. */
	private static String reason(Exception ex) {
		if (ex instanceof MarkedYAMLException marked && marked.getProblemMark() != null) {
			String problem = marked.getProblem() != null ? marked.getProblem() : marked.getContext();
			return problem + " (line " + (marked.getProblemMark().getLine() + 1) + ")";
		}
		String message = ex.getMessage();
		return message == null ? ex.getClass().getSimpleName() : message.lines().findFirst().orElse("");
	}

}
