package io.opencelium.core.settings;

import java.util.Optional;

import org.bson.Document;

/**
 * Breaks the rule "the settings collection only through the settings service": another class of the package reads
 * the settings repository. A test of the build rules imports it; it is no bean.
 */
class SettingsRepositoryUserSample {

	Optional<Document> read(SettingsRepository repository) {
		return repository.installationValues();
	}

}
