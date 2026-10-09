package io.opencelium.core.setup.values;

import java.util.Arrays;
import java.util.Optional;
import java.util.stream.Collectors;

/** The questions of the wizard, by the key a setup file uses for them. */
public enum ValueKey {

	DATA_DIR("data-dir"),

	PORT("port");

	private final String word;

	ValueKey(String word) {
		this.word = word;
	}

	/** The key as it is written in the setup file. */
	public String word() {
		return word;
	}

	public static Optional<ValueKey> parse(String word) {
		return Arrays.stream(values()).filter(key -> key.word.equals(word)).findFirst();
	}

	/** All keys, comma-separated, for a message. */
	public static String words() {
		return Arrays.stream(values()).map(ValueKey::word).collect(Collectors.joining(", "));
	}

}
