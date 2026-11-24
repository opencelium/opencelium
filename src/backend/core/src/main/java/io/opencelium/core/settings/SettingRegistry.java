package io.opencelium.core.settings;

import java.util.List;
import java.util.Optional;

/**
 * The setting definitions of all features, collected at the start. A setting key that 2 definitions declare stops the
 * start.
 */
final class SettingRegistry {

	SettingRegistry(List<SettingDefinition> definitions) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** The definition of the setting key, or empty when no feature declares it. */
	Optional<SettingDefinition> definition(String key) {
		throw new UnsupportedOperationException("not implemented yet");
	}

	/** All definitions. */
	List<SettingDefinition> definitions() {
		throw new UnsupportedOperationException("not implemented yet");
	}

}
