package io.opencelium.core.settings;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

import org.bson.Document;

import io.opencelium.core.settings.InvalidSettingsException.Problem;
import io.opencelium.core.settings.InvalidSettingsException.SettingError;

/**
 * Reads and changes the runtime settings. The only path of the code to the settings collection. It reads the database
 * at each call and keeps no copy, so a value that another core instance changes is visible at the next read.
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

	/**
	 * Changes the settings of the map in 1 update: a valid new value replaces the database value, and the value
	 * {@code null} or the default removes it. A map with 1 unknown setting key or 1 value that is not valid changes
	 * nothing.
	 *
	 * @param changes the setting keys and their new values; a value can be {@code null}
	 * @return each declared setting with its value after the change
	 * @throws InvalidSettingsException when a setting key is unknown or a value is not valid; it names each such key
	 */
	List<SettingValue> change(Map<String, Object> changes) {
		Map<String, Object> sorted = new TreeMap<>(changes);
		List<SettingError> errors = new ArrayList<>();
		Map<String, Object> values = new LinkedHashMap<>();
		List<String> resets = new ArrayList<>();
		sorted.forEach((key, value) -> {
			Optional<SettingDefinition> definition = registry.definition(key);
			if (definition.isEmpty()) {
				errors.add(new SettingError(key, Problem.UNKNOWN_KEY));
			}
			else if (value == null) {
				resets.add(key);
			}
			else if (!definition.get().type().validate(value, definition.get().min(), definition.get().max())) {
				errors.add(new SettingError(key, Problem.INVALID_VALUE));
			}
			else if (databaseValue(definition.get(), value).equals(definition.get().defaultValue())) {
				resets.add(key);
			}
			else {
				values.put(key, databaseValue(definition.get(), value));
			}
		});
		if (!errors.isEmpty()) {
			throw new InvalidSettingsException(errors);
		}
		repository.change(values, resets);
		return read();
	}

	/**
	 * The value as the database keeps it: an integer always as a 32-bit number, also when the JSON parser gave a
	 * long.
	 */
	private static Object databaseValue(SettingDefinition definition, Object valid) {
		return definition.type() == SettingType.INTEGER ? Integer.valueOf(((Number) valid).intValue()) : valid;
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
