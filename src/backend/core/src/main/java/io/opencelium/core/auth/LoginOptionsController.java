package io.opencelium.core.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.config.OpenCeliumProperties;
import io.opencelium.core.settings.SettingReader;

/**
 * The login options that the login page shows: the OIDC providers of the installation, with the provider ID and the
 * display name of each, in the order of the setting. The endpoint is open: the login page has no session JWT yet. It
 * reads the setting at each request, keeps no copy, and makes no request to an IdP. The response holds nothing else
 * of an OIDC provider, so it holds no issuer URL, no client ID and no client secret.
 * <p>
 * The cloud mode has no OIDC login strategy, so its list is empty, also when the settings document holds an OIDC
 * provider.
 */
@RestController
final class LoginOptionsController {

	static final String PATH = "/api/auth/oidc/providers";

	private final DeploymentMode mode;

	private final SettingReader settings;

	LoginOptionsController(OpenCeliumProperties properties, SettingReader settings) {
		this.mode = properties.deploymentMode();
		this.settings = settings;
	}

	@GetMapping(PATH)
	List<LoginOption> providers() {
		return switch (mode) {
			case SELF_HOST -> optionsOf(settings.items(OidcProviders.KEY));
			case CLOUD -> List.of();
		};
	}

	/** The option of each stored OIDC provider; an item without a text for its ID or its display name has none. */
	private static List<LoginOption> optionsOf(List<Map<String, Object>> providers) {
		List<LoginOption> options = new ArrayList<>();
		for (Map<String, Object> provider : providers) {
			if (provider.get(OidcProviders.ID) instanceof String id
					&& provider.get(OidcProviders.DISPLAY_NAME) instanceof String displayName) {
				options.add(new LoginOption(id, displayName));
			}
		}
		return options;
	}

	/**
	 * @param id          the provider ID, for the login endpoint of the OIDC provider
	 * @param displayName the name that the login page shows
	 */
	record LoginOption(String id, String displayName) {

	}

}
