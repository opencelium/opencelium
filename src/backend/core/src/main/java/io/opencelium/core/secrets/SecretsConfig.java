package io.opencelium.core.secrets;

import java.time.Clock;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import io.opencelium.common.secret.SecretProvider;
import io.opencelium.core.secrets.keys.DekAccess;

/** The secret storage of core, as the secret provider of the application. */
@Configuration(proxyBeanMethods = false)
class SecretsConfig {

	/** @param mongo the template of the database that the yml file names */
	@Bean
	SecretProvider secretProvider(MongoTemplate mongo, DekAccess dekAccess, Clock clock) {
		return new MongoSecretStorage(mongo, dekAccess, new SecretCipher(), clock);
	}

}
