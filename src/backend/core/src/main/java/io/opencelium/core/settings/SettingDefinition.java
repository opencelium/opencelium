package io.opencelium.core.settings;

/**
 * The declaration of 1 runtime setting in the code. A feature declares each of its settings as a bean of this type,
 * and the setting registry collects them at the start. A setting without a value in the database has its default.
 *
 * @param key          the setting key, the name of the setting in the settings API, for example {@code broker.port}
 * @param type         the type of the value
 * @param defaultValue the default, or {@code null} when the setting has no value by default
 */
public record SettingDefinition(String key, SettingType type, Object defaultValue) {

}
