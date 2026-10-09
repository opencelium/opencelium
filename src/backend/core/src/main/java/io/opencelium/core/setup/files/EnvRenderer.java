package io.opencelium.core.setup.files;

import java.util.SequencedMap;

/**
 * The text of the env file: a fixed header line, then one {@code KEY=value} line for each entry, in order, the
 * format of systemd's {@code EnvironmentFile}. A value with whitespace, a quote, a backslash, a hash or a dollar is
 * double-quoted with backslash escapes, as systemd reads it. No value is written yet: the file exists so that a
 * service unit can always name it, and so that its owner-only permissions are in place from the first setup.
 */
public final class EnvRenderer {

	static final String HEADER = "# Written by OpenCelium setup. One KEY=value for each line; application.yml refers"
			+ " to these names.";

	private EnvRenderer() {
	}

	public static String render(SequencedMap<String, String> values) {
		var text = new StringBuilder(HEADER).append('\n');
		values.forEach((key, value) -> text.append(key).append('=').append(quoted(value)).append('\n'));
		return text.toString();
	}

	private static String quoted(String value) {
		boolean plain = value.chars().noneMatch(c -> Character.isWhitespace(c) || "\"'\\#$".indexOf(c) >= 0);
		if (plain) {
			return value;
		}
		return '"' + value.replace("\\", "\\\\").replace("\"", "\\\"") + '"';
	}

}
