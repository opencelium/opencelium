package io.opencelium.core.auth;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import io.opencelium.core.config.DeploymentMode;
import io.opencelium.core.settings.SettingList;
import io.opencelium.core.settings.SettingList.ItemField;
import io.opencelium.core.settings.SettingRule;
import io.opencelium.core.settings.SettingType;

/**
 * The OIDC providers of the installation: the setting key, the form of an OIDC provider, and the rule of the OIDC login
 * strategy for a valid value.
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

	static final String ID = "id";

	static final String DISPLAY_NAME = "display-name";

	static final String ISSUER_URL = "issuer-url";

	static final String CLIENT_ID = "client-id";

	static final String CLIENT_SECRET = "client-secret";

	static final String EMAIL_LINK = "email-link";

	/**
	 * The form of an OIDC provider. The email-link option is off when an item does not give it. The client secret is
	 * the secret field, and it belongs to the issuer URL: a client secret that an item keeps goes only to the IdP of
	 * the issuer URL that it was given for.
	 */
	static final SettingList ITEMS = new SettingList(List.of(new ItemField(ID, SettingType.TEXT, null, 1, 40),
			new ItemField(DISPLAY_NAME, SettingType.TEXT, null, 1, 100),
			new ItemField(ISSUER_URL, SettingType.TEXT, null, 1, 2048),
			new ItemField(CLIENT_ID, SettingType.TEXT, null, 1, 255),
			new ItemField(CLIENT_SECRET, SettingType.SECRET, null, 1, 1024),
			new ItemField(EMAIL_LINK, SettingType.BOOLEAN, false, 0, 0)), ID, CLIENT_SECRET, ISSUER_URL);

	private static final Pattern PROVIDER_ID = Pattern.compile("[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?");

	private static final String HTTPS = "https";

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
		if (!(value instanceof List<?> providers)) {
			return false;
		}
		if (providers.isEmpty()) {
			return true;
		}
		if (mode != DeploymentMode.SELF_HOST) {
			return false;
		}
		return providers.stream().allMatch(provider -> provider instanceof Map<?, ?> fields && isValid(fields));
	}

	private static boolean isValid(Map<?, ?> provider) {
		return provider.get(ID) instanceof String id && PROVIDER_ID.matcher(id).matches()
				&& provider.get(ISSUER_URL) instanceof String issuerUrl && isHttpsUrlWithHost(issuerUrl);
	}

	private static boolean isHttpsUrlWithHost(String text) {
		try {
			URI url = new URI(text);
			return HTTPS.equalsIgnoreCase(url.getScheme()) && url.getHost() != null;
		}
		catch (URISyntaxException ex) {
			return false;
		}
	}

}
