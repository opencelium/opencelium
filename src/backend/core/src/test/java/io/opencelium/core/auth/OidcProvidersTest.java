package io.opencelium.core.auth;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import io.opencelium.core.config.DeploymentMode;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The rule of the OIDC login strategy for the OIDC providers of a change: an issuer URL with HTTPS, a provider ID that
 * can be a part of a path, and no OIDC provider in the cloud mode. The items of the cases have the form of a change
 * that the list of the setting accepts.
 */
class OidcProvidersTest {

	private static final String ISSUER_URL = "https://idp.example.com/realms/oc";

	private final OidcProviders selfHost = new OidcProviders(DeploymentMode.SELF_HOST);

	@Test
	void validateAcceptsAProviderWhenTheIssuerUrlHasHttps() {
		assertThat(selfHost.validate(List.of(provider("kc", ISSUER_URL)))).isTrue();
		assertThat(selfHost.validate(List.of(provider("kc", "https://idp.example.com:8443/realms/oc")))).isTrue();
	}

	@Test
	void validateAcceptsTwoProvidersWhenEachIssuerUrlHasHttps() {
		assertThat(selfHost.validate(
				List.of(provider("kc", ISSUER_URL), provider("kc2", "https://login.example.org/tenant-2/v2.0"))))
			.isTrue();
	}

	@Test
	void validateRefusesAProviderWhenTheIssuerUrlHasHttp() {
		assertThat(selfHost.validate(List.of(provider("kc", "http://idp.example.com/realms/oc")))).isFalse();
	}

	@Test
	void validateRefusesTheListWhenOneOfTwoIssuerUrlsHasHttp() {
		assertThat(selfHost
			.validate(List.of(provider("kc", ISSUER_URL), provider("kc2", "http://login.example.org/tenant-2"))))
			.isFalse();
	}

	@Test
	void validateRefusesAProviderWhenTheIssuerUrlHasAnotherSchemeOrNone() {
		assertThat(selfHost.validate(List.of(provider("kc", "ftp://idp.example.com/realms/oc")))).isFalse();
		assertThat(selfHost.validate(List.of(provider("kc", "idp.example.com/realms/oc")))).isFalse();
	}

	@Test
	void validateRefusesAProviderWhenTheIssuerUrlHasNoHost() {
		assertThat(selfHost.validate(List.of(provider("kc", "https:///realms/oc")))).isFalse();
		assertThat(selfHost.validate(List.of(provider("kc", "https:idp.example.com")))).isFalse();
	}

	@Test
	void validateRefusesAProviderWhenTheIssuerUrlIsNotAUrl() {
		assertThat(selfHost.validate(List.of(provider("kc", "https://idp example.com/realms/oc")))).isFalse();
	}

	@Test
	void validateAcceptsAProviderIdWhenItHasLettersAToZDigitsAndHyphens() {
		for (String id : new String[] { "kc", "kc-2", "0", "entra-id-prod", "a".repeat(40) }) {
			assertThat(selfHost.validate(List.of(provider(id, ISSUER_URL)))).as("the provider ID %s", id).isTrue();
		}
	}

	@Test
	void validateRefusesAProviderIdWhenItHasAnotherCharacter() {
		for (String id : new String[] { "KC", "Kc", "kc_2", "kc.2", "kc 2", "kc/2", "kc%2F", "kç" }) {
			assertThat(selfHost.validate(List.of(provider(id, ISSUER_URL)))).as("the provider ID %s", id).isFalse();
		}
	}

	@Test
	void validateRefusesAProviderIdWhenItStartsOrEndsWithAHyphen() {
		assertThat(selfHost.validate(List.of(provider("-kc", ISSUER_URL)))).isFalse();
		assertThat(selfHost.validate(List.of(provider("kc-", ISSUER_URL)))).isFalse();
	}

	@Test
	void validateRefusesAProviderIdWhenItHasMoreThan40Characters() {
		assertThat(selfHost.validate(List.of(provider("a".repeat(41), ISSUER_URL)))).isFalse();
	}

	@Test
	void validateRefusesAProviderWhenTheModeIsCloud() {
		var cloud = new OidcProviders(DeploymentMode.CLOUD);

		assertThat(cloud.validate(List.of(provider("kc", ISSUER_URL)))).isFalse();
	}

	/** An OIDC provider of a change with each field, as the JSON parser gives it, with a new random client secret. */
	private static Map<String, Object> provider(String id, String issuerUrl) {
		Map<String, Object> provider = new LinkedHashMap<>();
		provider.put("id", id);
		provider.put("display-name", "Keycloak " + id);
		provider.put("issuer-url", issuerUrl);
		provider.put("client-id", "core");
		provider.put("client-secret", UUID.randomUUID().toString());
		provider.put("email-link", false);
		return provider;
	}

}
