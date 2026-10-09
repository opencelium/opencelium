package io.opencelium.core.setup.values;

import java.io.IOException;
import java.io.Reader;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;

import org.yaml.snakeyaml.DumperOptions;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;
import org.yaml.snakeyaml.constructor.SafeConstructor;
import org.yaml.snakeyaml.error.MarkedYAMLException;
import org.yaml.snakeyaml.error.YAMLException;
import org.yaml.snakeyaml.representer.Representer;
import org.yaml.snakeyaml.resolver.Resolver;

import io.opencelium.core.setup.SetupFailedException;

/**
 * Reads the setup file: YAML with one {@code key: value} line for each question, for example
 * {@code data-dir: ./data} and {@code port: 9090}. Each value is kept as the text that is written, stripped, so it
 * means what the same text typed at the prompt means: YAML's type guessing is off, because it would read {@code ~}
 * as no value, {@code 010} as 8, and {@code yes} as true. A key without a value or with a blank value is the same
 * as an absent key. An unknown key is an error, so a typo cannot silently turn into a question; a duplicated key and
 * a value that is a list or a map are errors too.
 */
public final class SetupFile {

	private SetupFile() {
	}

	/**
	 * @throws SetupFailedException with exit code 1 when the file is missing, unreadable or broken, holds an unknown
	 *                              or duplicated key, or holds a value that is not one value
	 */
	public static SetupValues load(Path file) {
		if (Files.isDirectory(file)) {
			throw SetupFailedException.failure("The setup file " + file + " is a directory, not a file.");
		}
		Object document;
		try (Reader reader = Files.newBufferedReader(file)) {
			document = textOnlyYaml().load(reader);
		}
		catch (NoSuchFileException ex) {
			throw SetupFailedException.failure("The setup file " + file + " does not exist.");
		}
		catch (AccessDeniedException ex) {
			throw SetupFailedException.failure("The setup file " + file + " cannot be read: permission denied");
		}
		catch (IOException | YAMLException ex) {
			throw SetupFailedException.failure("The setup file " + file + " cannot be read: " + reason(ex));
		}
		if (document == null) {
			return SetupValues.NONE;
		}
		if (!(document instanceof Map<?, ?> entries)) {
			throw SetupFailedException.failure("The setup file " + file + " must hold key: value lines.");
		}
		Map<ValueKey, String> values = new EnumMap<>(ValueKey.class);
		for (Map.Entry<?, ?> entry : entries.entrySet()) {
			String word = String.valueOf(entry.getKey());
			ValueKey key = ValueKey.parse(word).orElseThrow(() -> SetupFailedException.failure(
					"Unknown key '" + word + "' in " + file + ". Known keys: " + ValueKey.words() + "."));
			Object value = entry.getValue();
			if (value instanceof Collection || value instanceof Map) {
				throw SetupFailedException.failure("Bad value: " + key.word() + " in " + file
						+ ": one value is expected.");
			}
			String text = value == null ? "" : String.valueOf(value).strip();
			if (!text.isEmpty()) {
				values.put(key, text);
			}
		}
		return new SetupValues(values);
	}

	/**
	 * A safe YAML reader that resolves every plain scalar as a string and rejects a duplicated key, which it would
	 * otherwise resolve silently to the last value.
	 */
	private static Yaml textOnlyYaml() {
		var options = new LoaderOptions();
		options.setAllowDuplicateKeys(false);
		var noTypeGuessing = new Resolver() {
			@Override
			protected void addImplicitResolvers() {
				// None: a plain scalar stays a string.
			}
		};
		var dumperOptions = new DumperOptions();
		return new Yaml(new SafeConstructor(options), new Representer(dumperOptions), dumperOptions, options,
				noTypeGuessing);
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
