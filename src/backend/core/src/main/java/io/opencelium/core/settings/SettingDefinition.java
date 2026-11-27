package io.opencelium.core.settings;

/**
 * The declaration of 1 runtime setting in the code. A feature declares each of its settings as a bean of this type,
 * and the setting registry collects them at the start. A setting without a value in the database has its default.
 *
 * @param key          the setting key, the name of the setting in the settings API, for example {@code broker.port}
 * @param type         the type of the value
 * @param defaultValue the default, or {@code null} when the setting has no value by default
 * @param min          the lower bound of a valid value: the number for an integer, the number of characters for a
 *                     text or a host, the number of items for a list
 * @param max          the upper bound of a valid value, in the unit of {@code min}
 * @param list         the form of an item when the type is {@link SettingType#LIST}, else {@code null}
 * @param rule         a rule of the feature that a value of a change must also pass before the settings document
 *                     changes, or {@code null} when the type and the bounds are the only rules
 */
public record SettingDefinition(String key, SettingType type, Object defaultValue, int min, int max, SettingList list,
		SettingRule rule) {

	/** A setting whose type is not a list, without a rule of its feature. */
	public SettingDefinition(String key, SettingType type, Object defaultValue, int min, int max) {
		this(key, type, defaultValue, min, max, null, null);
	}

}
