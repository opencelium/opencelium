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
	HOST

}
