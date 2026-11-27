package io.opencelium.core.auth;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.settings.SettingRule;

/**
 * The OIDC providers of the installation: the setting key, and the rule of the OIDC login strategy for a valid value.
 * <p>
 * The rule refuses a list in which 1 item breaks 1 of these rules:
 * <ul>
 * <li>The issuer URL is an absolute HTTPS URL with a host: core sends the client secret to the IdP of the issuer
 * URL, never over plain HTTP.</li>
 * <li>The provider ID has 1 to 40 characters, each a letter a to z, a digit or a hyphen, and no hyphen first or last:
 * it is a part of the path of the login endpoints.</li>
 * <li>The deployment mode is the self-host mode: the cloud mode has no OIDC login strategy, so it refuses each OIDC
 * provider.</li>
 * </ul>
 */
final class OidcProviders implements SettingRule {

	static final String KEY = "oidc.providers";

	private final DeploymentMode mode;

	OidcProviders(DeploymentMode mode) {
		this.mode = mode;
	}

	/**
	 * @param value the items of a change, whose form the list of the setting accepts
	 * @return {@code true} when each item passes the rules of the OIDC login strategy in the deployment mode
	 */
	@Override
	public boolean validate(Object value) {
		throw new UnsupportedOperationException();
	}

}
