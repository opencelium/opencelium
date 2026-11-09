package io.opencelium.core.setup.files;

import java.util.SequencedMap;

/**
 * The text of the env file: a fixed header line, then one {@code KEY=value} line for each entry, in order. A value
 * with whitespace or a character that the shell reads as syntax ({@code " ' \ # $ ` ; & | < > ( ) * ? [ ] { } ~ !})
 * is double-quoted, and inside the quotes {@code \ " $} and the backtick are escaped. POSIX sh, systemd's
 * {@code EnvironmentFile} and the start of the application read this form the same way, so each of them gives the
 * application the value that was written.
 */
public final class EnvRenderer {

	static final String HEADER = "# Written by OpenCelium setup. One KEY=value for each line; application.yml refers"
			+ " to these names.";

	/** The characters, besides whitespace, that the shell would read as syntax in a value without quotes. */
	private static final String NEEDS_QUOTES = "\"'\\#$`;&|<>()*?[]{}~!";

	/** The characters that keep a meaning inside double quotes, for the shell and for systemd alike. */
	private static final String ESCAPED = "\\\"$`";

	private EnvRenderer() {
	}

	public static String render(SequencedMap<String, String> values) {
		var text = new StringBuilder(HEADER).append('\n');
		values.forEach((key, value) -> text.append(key).append('=').append(quoted(value)).append('\n'));
		return text.toString();
	}

	private static String quoted(String value) {
		boolean plain = value.chars().noneMatch(c -> Character.isWhitespace(c) || NEEDS_QUOTES.indexOf(c) >= 0);
		if (plain) {
			return value;
		}
		var text = new StringBuilder().append('"');
		value.chars().forEach(c -> {
			if (ESCAPED.indexOf(c) >= 0) {
				text.append('\\');
			}
			text.append((char) c);
		});
		return text.append('"').toString();
	}

}
