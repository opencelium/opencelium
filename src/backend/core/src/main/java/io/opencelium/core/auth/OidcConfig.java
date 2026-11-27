package io.opencelium.core.auth;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingDefinition;
import io.opencelium.core.settings.SettingType;

/**
 * The OIDC login strategy: the installation setting of the OIDC providers. The setting has no OIDC provider by
 * default, and its number of OIDC providers has no fixed limit.
 */
@Configuration(proxyBeanMethods = false)
class OidcConfig {

	@Bean
	SettingDefinition oidcProvidersSetting(OpenCeliumProperties properties) {
		return new SettingDefinition(OidcProviders.KEY, SettingType.LIST, List.of(), 0, Integer.MAX_VALUE,
				OidcProviders.ITEMS, new OidcProviders(properties.deploymentMode()));
	}

}
