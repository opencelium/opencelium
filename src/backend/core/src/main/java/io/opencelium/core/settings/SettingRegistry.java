package io.opencelium.core.settings;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

/**
 * The setting definitions of all features, collected at the start. A setting key that 2 definitions declare stops the
 * start, because the settings API could then not tell which definition a value belongs to.
 */
final class SettingRegistry {

	private final Map<String, SettingDefinition> definitions = new TreeMap<>();

	/** @throws IllegalStateException when 2 definitions declare the same setting key; the message names the key */
	SettingRegistry(List<SettingDefinition> definitions) {
		for (SettingDefinition definition : definitions) {
			if (this.definitions.putIfAbsent(definition.key(), definition) != null) {
				throw new IllegalStateException(
						"The setting key " + definition.key() + " has more than 1 setting definition.");
			}
		}
	}

	/** The definition of the setting key, or empty when no feature declares it. */
	Optional<SettingDefinition> definition(String key) {
		return Optional.ofNullable(definitions.get(key));
	}

	/** All definitions. */
	List<SettingDefinition> definitions() {
		return List.copyOf(definitions.values());
	}

}
