package io.opencelium.core.settings;

import java.util.List;
import java.util.stream.Collectors;

/**
 * A change of the settings with an unknown setting key or a value that is not valid. It names each such key and its
 * problem, and never a value: a value can be a credential.
 */
final class InvalidSettingsException extends RuntimeException {

	private final List<SettingError> errors;

	InvalidSettingsException(List<SettingError> errors) {
		super("The change of the settings has incorrect setting keys: "
				+ errors.stream().map(SettingError::key).collect(Collectors.joining(", ")) + ".");
		this.errors = List.copyOf(errors);
	}

	/** Each incorrect setting key with its problem, in the order of the setting keys. */
	List<SettingError> errors() {
		return errors;
	}

	/** The problem of 1 setting key of a change. */
	enum Problem {

		/** No feature declares the setting key. */
		UNKNOWN_KEY("unknown-key"),

		/** The value has not the JSON form of the type of the setting, or it is outside the bounds. */
		INVALID_VALUE("invalid-value");

		private final String code;

		Problem(String code) {
			this.code = code;
		}

		/** The text of the problem in an error response. */
		String code() {
			return code;
		}

	}

	/**
	 * @param key     the setting key of the change
	 * @param problem the problem of the setting key
	 */
	record SettingError(String key, Problem problem) {

	}

}
