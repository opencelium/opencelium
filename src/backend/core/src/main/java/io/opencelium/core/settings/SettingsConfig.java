package io.opencelium.core.settings;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * The runtime settings: the registry of the setting definitions that the features declare as beans, the repository
 * of their database values, and the service that reads them.
 */
@Configuration(proxyBeanMethods = false)
class SettingsConfig {

	@Bean
	SettingRegistry settingRegistry(List<SettingDefinition> definitions) {
		return new SettingRegistry(definitions);
	}

	/** @param mongo the template of the database that the yml file names */
	@Bean
	SettingsRepository settingsRepository(MongoTemplate mongo) {
		return new SettingsRepository(mongo);
	}

	@Bean
	SettingsService settingsService(SettingRegistry registry, SettingsRepository repository) {
		return new SettingsService(registry, repository);
	}

}
