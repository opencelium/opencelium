package io.opencelium.core.setup.answers;

import java.util.Map;
import java.util.Optional;

/**
 * The answers an answers file gave: at most one text for each key, as the user would have typed it. A step checks
 * the text with the same rules as a typed answer.
 */
public record Answers(Map<AnswerKey, String> values) {

	/** No answers file: every question is asked. */
	public static final Answers NONE = new Answers(Map.of());

	public Answers {
		values = Map.copyOf(values);
	}

	public Optional<String> get(AnswerKey key) {
		return Optional.ofNullable(values.get(key));
	}

}
