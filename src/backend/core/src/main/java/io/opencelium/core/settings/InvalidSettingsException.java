package io.opencelium.core.settings;

import java.util.List;

/**
 * A change of the settings with an unknown setting key or a value that is not valid. It names each such key and its
 * problem, and never a value: a value can be a credential.
 */
final class InvalidSettingsException extends RuntimeException {

	InvalidSettingsException(List<SettingError> errors) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** Each incorrect setting key with its problem, in the order of the setting keys. */
	List<SettingError> errors() {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** The problem of 1 setting key of a change. */
	enum Problem {

		/** No feature declares the setting key. */
		UNKNOWN_KEY,

		/** The value has not the JSON form of the type of the setting, or it is outside the bounds. */
		INVALID_VALUE

	}

	/**
	 * @param key     the setting key of the change
	 * @param problem the problem of the setting key
	 */
	record SettingError(String key, Problem problem) {

	}

}
