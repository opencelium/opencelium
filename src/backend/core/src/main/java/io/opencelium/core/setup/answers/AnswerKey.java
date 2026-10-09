package io.opencelium.core.setup.answers;

import java.util.Arrays;
import java.util.Optional;
import java.util.stream.Collectors;

/** The questions of the wizard, by the key an answers file uses for them. */
public enum AnswerKey {

	DATA_DIR("data-dir"),

	PORT("port");

	private final String word;

	AnswerKey(String word) {
		this.word = word;
	}

	/** The key as it is written in the answers file. */
	public String word() {
		return word;
	}

	public static Optional<AnswerKey> parse(String word) {
		return Arrays.stream(values()).filter(key -> key.word.equals(word)).findFirst();
	}

	/** All keys, comma-separated, for a message. */
	public static String words() {
		return Arrays.stream(values()).map(AnswerKey::word).collect(Collectors.joining(", "));
	}

}
