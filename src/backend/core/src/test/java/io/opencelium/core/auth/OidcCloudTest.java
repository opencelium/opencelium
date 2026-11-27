package io.opencelium.core.auth;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import io.opencelium.core.settings.SettingDefinition;
import io.opencelium.core.testsupport.CloudStart;
import io.opencelium.core.testsupport.MongoIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * In the cloud mode the installation has no OIDC login strategy: the setting of the OIDC providers of the running
 * application refuses each OIDC provider, also a valid one of the self-host mode. Thus a change refuses it even when a
 * later rule lets a user change an installation setting in the cloud mode. That no OpenCelium user changes an
 * installation setting in the cloud mode today is the subject of the settings cloud test.
 */
@MongoIntegrationTest
class OidcCloudTest {

	@TempDir
	static Path dataDir;

	@DynamicPropertySource
	static void properties(DynamicPropertyRegistry registry) {
		CloudStart.register(registry, OidcCloudTest.class, () -> dataDir);
	}

	@Autowired
	List<SettingDefinition> definitions;

	@Test
	void validateRefusesAnOidcProviderWhenTheModeIsCloud() {
		SettingDefinition providers = definitions.stream()
			.filter(definition -> definition.key().equals("oidc.providers"))
			.findFirst()
			.orElseThrow();
		assertThat(providers.rule()).as("the rule of the OIDC providers").isNotNull();

		assertThat(providers.rule().validate(List.of(validProvider()))).isFalse();
	}

	/** An OIDC provider that the self-host mode accepts, with a new random client secret. */
	private static Map<String, Object> validProvider() {
		Map<String, Object> provider = new LinkedHashMap<>();
		provider.put("id", "kc");
		provider.put("display-name", "Keycloak");
		provider.put("issuer-url", "https://idp.example.com/realms/oc");
		provider.put("client-id", "core");
		provider.put("client-secret", UUID.randomUUID().toString());
		provider.put("email-link", false);
		return provider;
	}

}
