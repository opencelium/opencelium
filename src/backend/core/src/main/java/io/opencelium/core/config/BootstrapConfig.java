package io.opencelium.core.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods = false)
public final class BootstrapConfig {

	@Bean
	OpenCeliumProperties openCeliumProperties(Environment environment) {
		return OpenCeliumProperties.from(environment);
	}

	@Bean
	DataDirectory dataDirectory(OpenCeliumProperties properties) {
		return DataDirectory.prepare(properties.dataDir());
	}

}
