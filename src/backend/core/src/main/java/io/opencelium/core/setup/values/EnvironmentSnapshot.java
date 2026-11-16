package io.opencelium.core.setup.values;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * The bootstrap values that the environment variables of the setup give, read 1 time when the setup starts.
 */
public final class EnvironmentSnapshot {

	/**
	 * @param variables the environment variables of the setup ({@code System.getenv()} in production)
	 */
	public EnvironmentSnapshot(Map<String, String> variables) {
		throw new UnsupportedOperationException("not implemented");
	}

	/** The names of the variables that give a bootstrap value. */
	public List<String> names() {
		throw new UnsupportedOperationException("not implemented");
	}

	/** The value of a bootstrap property as the start reads it, with the name of its variable. */
	public Optional<Value> value(String property) {
		throw new UnsupportedOperationException("not implemented");
	}

	/**
	 * A bootstrap value from the environment.
	 *
	 * @param variable the name of the environment variable that gives it, for example {@code SERVER_PORT}
	 * @param text     the value as the start reads it
	 */
	public record Value(String variable, String text) {

		public Value {
			Objects.requireNonNull(variable, "variable");
			Objects.requireNonNull(text, "text");
		}

	}

}
