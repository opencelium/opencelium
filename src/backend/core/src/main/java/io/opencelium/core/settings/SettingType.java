package io.opencelium.core.settings;

/**
 * The type of a runtime setting: it gives the JSON form of the value in the settings API.
 */
public enum SettingType {

	/** A JSON string. */
	TEXT,

	/** A JSON number without a fraction. */
	INTEGER,

	/** A JSON string with a host name or an IP address. */
	HOST;

	/**
	 * @param value a value from the settings API, never {@code null}
	 * @param min   the lower bound of the setting definition
	 * @param max   the upper bound of the setting definition
	 * @return {@code true} when the value has the JSON form of this type and is inside the bounds
	 */
	boolean validate(Object value, int min, int max) {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
