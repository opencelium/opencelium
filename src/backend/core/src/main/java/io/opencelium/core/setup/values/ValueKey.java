package io.opencelium.core.setup.values;

import java.util.Arrays;
import java.util.Optional;
import java.util.stream.Collectors;

import io.opencelium.core.config.BootstrapProperties;
import io.opencelium.core.config.OpenCeliumProperties;

/** The questions of the wizard, by the key a setup file uses for them. */
public enum ValueKey {

	DATA_DIR("data-dir", OpenCeliumProperties.DATA_DIR),

	PORT("port", BootstrapProperties.SERVER_PORT),

	MONGO("mongo"),

	MONGO_URI("mongo-uri"),

	MASTER_KEY("master-key"),

	ADMIN_USERNAME("admin-username");

	private final String word;

	private final String property;

	ValueKey(String word) {
		this(word, null);
	}

	ValueKey(String word, String property) {
		this.word = word;
		this.property = property;
	}

	/** The key as it is written in the setup file. */
	public String word() {
		return word;
	}

	/**
	 * The bootstrap property that gives the value of this key at the start, so an environment variable for it gives
	 * the value of the setup too. Empty when no property or more than 1 property gives the value.
	 */
	public Optional<String> property() {
		return Optional.ofNullable(property);
	}

	public static Optional<ValueKey> parse(String word) {
		return Arrays.stream(values()).filter(key -> key.word.equals(word)).findFirst();
	}

	/** All keys, comma-separated, for a message. */
	public static String words() {
		return Arrays.stream(values()).map(ValueKey::word).collect(Collectors.joining(", "));
	}

}
