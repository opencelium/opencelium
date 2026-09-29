package io.opencelium.core.secrets.keys;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;

import io.opencelium.core.config.DataDirectory;
import io.opencelium.core.config.OpenCeliumProperties;

/**
 * The root key and its startup checks. The key is resolved once, when the context starts, and closed (zeroed) on
 * shutdown.
 */
@Configuration(proxyBeanMethods = false)
public final class RootKeyConfig {

	@Bean
	RootKeyResolver rootKeyResolver(OpenCeliumProperties properties, DataDirectory dataDirectory,
			ConfigurableEnvironment environment) {
		// The operating system's variables only: the master key is never read from application.yml.
		var variables = environment.getSystemEnvironment();
		return new RootKeyResolver(name -> (String) variables.get(name), properties.masterKeyFile(),
				dataDirectory.path(), new RootKeyGenerator());
	}

	@Bean
	RootKey rootKey(RootKeyResolver resolver, WrappedDekRepository repository) {
		return resolver.resolve(repository::existsAny);
	}

	@Bean
	DekWrapper dekWrapper() {
		return new DekWrapper();
	}

	@Bean
	KeyStartupCanary keyStartupCanary(WrappedDekRepository repository, DekWrapper wrapper, RootKey rootKey) {
		return new KeyStartupCanary(repository, wrapper, rootKey);
	}

}
