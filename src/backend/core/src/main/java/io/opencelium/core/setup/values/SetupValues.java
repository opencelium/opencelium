package io.opencelium.core.setup.values;

import java.util.Map;
import java.util.Optional;

/**
 * The values a setup file gave: at most one text for each key, stripped and never blank, as the user would have
 * typed it at the prompt. A step checks the text with the same rules as a typed answer.
 */
public record SetupValues(Map<ValueKey, String> values) {

	/** No setup file: every question is asked. */
	public static final SetupValues NONE = new SetupValues(Map.of());

	public SetupValues {
		values = Map.copyOf(values);
	}

	public Optional<String> get(ValueKey key) {
		return Optional.ofNullable(values.get(key));
	}

}
