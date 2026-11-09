package io.opencelium.core.config;

import java.io.IOException;
import java.nio.charset.CharacterCodingException;
import java.nio.file.AccessDeniedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.SequencedMap;
import java.util.regex.Pattern;

/**
 * Reads the env file that the setup wizard writes next to application.yml: the secrets that application.yml refers
 * to by name, for example the MongoDB password. It reads exactly the form the wizard writes, the form that POSIX sh
 * and systemd's {@code EnvironmentFile} read the same way, and stops on anything else, so that no value is read
 * differently from what the operator sees in the file.
 * <p>
 * The form has four kinds of lines: a comment, an empty line, {@code KEY=value} without whitespace and without a
 * character the shell reads as syntax, and {@code KEY="value"}, where only {@code \ " $} and the backtick need a
 * backslash before them. A line that ends with a carriage return is not in the form: the shell would keep the
 * carriage return as a part of the value.
 */
public final class EnvFileReader {

	/**
	 * The variable of the root key. The start refuses it here: the env file holds the database password, and the key
	 * must not be in the same file, so that one copied file never gives both.
	 */
	static final String MASTER_KEY_VARIABLE = "OC_MASTER_KEY";

	private static final Pattern KEY = Pattern.compile("[A-Za-z_][A-Za-z0-9_]*");

	private static final String EXPORT_PREFIX = "export ";

	/** The characters, besides whitespace, that the shell would read as syntax in a value without quotes. */
	private static final String NEEDS_QUOTES = "\"'\\#$`;&|<>()*?[]{}~!";

	/** The characters that keep a meaning inside double quotes and are written with a backslash before them. */
	private static final String ESCAPED = "\\\"$`";

	private static final String WRITTEN_FORM = "Write each line as KEY=value, or as KEY=\"value\" with a backslash before"
			+ " \\ \" $ and the backtick, then start again.";

	private EnvFileReader() {
	}

	/**
	 * The entries of the file, in the order of their lines.
	 *
	 * @throws EnvFileException when the file cannot be read, when a line is not in the written form, or when the file
	 *                          holds the master key
	 */
	public static SequencedMap<String, String> read(Path file) {
		String content;
		try {
			content = Files.readString(file);
		}
		catch (IOException ex) {
			throw new EnvFileException(file, 0, "the env file cannot be read (" + reason(ex) + ")",
					"Make the env file a readable UTF-8 text file for the user that starts OpenCelium, then start again.");
		}
		var entries = new LinkedHashMap<String, String>();
		String[] lines = content.split("\n", -1);
		for (int index = 0; index < lines.length; index++) {
			String line = lines[index];
			// Whitespace and comments carry no value, so a carriage return or an indentation there changes nothing.
			if (line.isBlank() || line.stripLeading().startsWith("#")) {
				continue;
			}
			int number = index + 1;
			if (line.endsWith("\r")) {
				throw new EnvFileException(file, number, "the line ends with a carriage return (a Windows line end)",
						"Save the env file with Unix line ends, then start again.");
			}
			int equals = line.indexOf('=');
			if (equals < 0) {
				throw new EnvFileException(file, number, "the line is not a comment and has no '='", WRITTEN_FORM);
			}
			String key = line.substring(0, equals);
			if (key.startsWith(EXPORT_PREFIX)) {
				throw new EnvFileException(file, number, "the line starts with 'export', which the env file does not use",
						"Remove 'export ' from the line, then start again.");
			}
			if (!KEY.matcher(key).matches()) {
				// The text before '=' is not shown: when it is not a name, it can be a part of a value.
				throw new EnvFileException(file, number,
						"the text before '=' is not a variable name (letters, digits and '_', not a digit first)",
						WRITTEN_FORM);
			}
			if (key.equals(MASTER_KEY_VARIABLE)) {
				throw new EnvFileException(file, number, MASTER_KEY_VARIABLE + " must not be in the env file, because"
						+ " the env file holds the database password",
						"Remove the line. Give the master key in the environment of the process or in a key file.");
			}
			entries.put(key, value(file, number, key, line.substring(equals + 1)));
		}
		return entries;
	}

	private static String value(Path file, int number, String key, String raw) {
		if (!raw.startsWith("\"")) {
			if (raw.chars().anyMatch(c -> Character.isWhitespace(c) || NEEDS_QUOTES.indexOf(c) >= 0)) {
				throw bad(file, number, "the value of " + key + " has whitespace or a shell character but no quotes");
			}
			return raw;
		}
		var value = new StringBuilder();
		for (int index = 1; index < raw.length(); index++) {
			char c = raw.charAt(index);
			if (c == '"') {
				if (index != raw.length() - 1) {
					throw bad(file, number, "the value of " + key + " has text after the closing double quote");
				}
				return value.toString();
			}
			if (c == '\\') {
				if (index + 1 == raw.length() || ESCAPED.indexOf(raw.charAt(index + 1)) < 0) {
					throw bad(file, number, "the value of " + key + " has a backslash that is not before \\ \" $ or the"
							+ " backtick");
				}
				value.append(raw.charAt(++index));
				continue;
			}
			if (c == '$' || c == '`') {
				throw bad(file, number, "the value of " + key + " has a $ or a backtick without a backslash before it");
			}
			value.append(c);
		}
		throw bad(file, number, "the value of " + key + " has no closing double quote");
	}

	private static EnvFileException bad(Path file, int number, String problem) {
		return new EnvFileException(file, number, problem, WRITTEN_FORM);
	}

	/** The cause in words; the message of these exceptions is the path, or a code that says nothing. */
	private static String reason(IOException ex) {
		if (ex instanceof AccessDeniedException) {
			return "permission denied";
		}
		if (ex instanceof CharacterCodingException) {
			return "the text is not UTF-8";
		}
		return ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
	}

}
