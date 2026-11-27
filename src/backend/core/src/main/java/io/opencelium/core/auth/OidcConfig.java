package io.opencelium.core.auth;

import java.time.Duration;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;

import io.opencelium.core.auth.oidc.OidcDiscovery;
import io.opencelium.core.auth.oidc.OidcRequestFactory;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingDefinition;
import io.opencelium.core.settings.SettingType;

/**
 * The OIDC login strategy: the installation setting of the OIDC providers, and the HTTP client of the calls of core
 * to an IdP. The setting has no OIDC provider by default, and its number of OIDC providers has no fixed limit.
 */
@Configuration(proxyBeanMethods = false)
class OidcConfig {

	/** The name of the bean of the HTTP client of the calls to an IdP; a test replaces the bean by this name. */
	static final String REQUEST_FACTORY = "oidcRequestFactory";

	/** The longest time to connect to an IdP, and the longest wait for its answer, for each call. */
	private static final Duration CALL_TIMEOUT = Duration.ofSeconds(10);

	/**
	 * Each call of core to an IdP goes through this bean, which has the timeout and follows no redirect. The caller
	 * makes the call only to an HTTPS address, and it limits the size of the body. The bean is no default candidate:
	 * an injection of a {@link ClientHttpRequestFactory} without a qualifier never gets the HTTP client of the IdP
	 * calls, and the injection of this bean needs its name.
	 */
	@Bean(name = REQUEST_FACTORY, defaultCandidate = false)
	ClientHttpRequestFactory oidcRequestFactory() {
		return OidcRequestFactory.create(CALL_TIMEOUT);
	}

	@Bean
	OidcDiscovery oidcDiscovery(@Qualifier(REQUEST_FACTORY) ClientHttpRequestFactory requestFactory) {
		return new OidcDiscovery(requestFactory);
	}

	@Bean
	SettingDefinition oidcProvidersSetting(OpenCeliumProperties properties, OidcDiscovery discovery) {
		var rule = new OidcProvidersDiscoveryRule(new OidcProviders(properties.deploymentMode()), discovery);
		return new SettingDefinition(OidcProviders.KEY, SettingType.LIST, List.of(), 0, Integer.MAX_VALUE,
				OidcProviders.ITEMS, rule);
	}

}
