package io.opencelium.core.settings;

import java.util.Arrays;
import java.util.List;

import org.bson.Document;

/**
 * Reads the runtime settings. The only path of the code to the settings collection. It reads the database at each
 * call and keeps no copy, so a value that another core instance changes is visible at the next read.
 */
final class SettingsService {

	private final SettingRegistry registry;

	private final SettingsRepository repository;

	SettingsService(SettingRegistry registry, SettingsRepository repository) {
		this.registry = registry;
		this.repository = repository;
	}

	/** Each declared setting with its value: the database value, or the default when the database has none. */
	List<SettingValue> read() {
		Document values = repository.installationValues().orElseGet(Document::new);
		return registry.definitions().stream().map(definition -> valueOf(definition, values)).toList();
	}

	private static SettingValue valueOf(SettingDefinition definition, Document values) {
		Object stored = values.getEmbedded(Arrays.asList(definition.key().split("\\.")), Object.class);
		return stored == null ? new SettingValue(definition.key(), definition.defaultValue(), true)
				: new SettingValue(definition.key(), stored, false);
	}

	/**
	 * @param key       the setting key
	 * @param value     the value; {@code null} when the setting has no value
	 * @param isDefault {@code true} when the value is the default, because the database has no value for the setting
	 */
	record SettingValue(String key, Object value, boolean isDefault) {

	}

}
