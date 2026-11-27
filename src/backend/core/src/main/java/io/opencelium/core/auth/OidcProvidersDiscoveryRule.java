package io.opencelium.core.auth;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import io.opencelium.core.auth.oidc.NoDiscoveryDocumentException;
import io.opencelium.core.auth.oidc.OidcDiscovery;
import io.opencelium.core.settings.SettingRule;

/**
 * The rule of the OIDC providers setting for a change: the form rules of {@link OidcProviders}, then the discovery
 * document of each issuer URL that the change makes new. An issuer URL is new for an OIDC provider whose provider ID
 * is not in the stored OIDC providers, or whose stored issuer URL is another one. A kept OIDC provider with its stored
 * issuer URL causes no request to its IdP, so a change of its display name needs no IdP that answers.
 * <p>
 * An issuer URL without a discovery document gives the problem {@code no-discovery-document}. The log line of the
 * refusal has the provider ID and a fixed reason, never the body of an answer of the IdP and never a client secret.
 */
final class OidcProvidersDiscoveryRule implements SettingRule {

	static final String NO_DISCOVERY_DOCUMENT = "no-discovery-document";

	private static final Log log = LogFactory.getLog(OidcProvidersDiscoveryRule.class);

	private final OidcProviders forms;

	private final OidcDiscovery discovery;

	/**
	 * @param forms     the rules of the form of the OIDC providers, which also refuse each OIDC provider in the cloud
	 *                  mode, before a request to an IdP
	 * @param discovery reads the discovery document of an issuer URL
	 */
	OidcProvidersDiscoveryRule(OidcProviders forms, OidcDiscovery discovery) {
		this.forms = forms;
		this.discovery = discovery;
	}

	@Override
	public boolean validate(Object value) {
		return forms.validate(value);
	}

	/**
	 * @param value  the items of a change, whose form the list of the setting accepts
	 * @param stored the OIDC providers as the database keeps them, or {@code null}
	 */
	@Override
	public Optional<String> problemOf(Object value, Object stored) {
		Optional<String> invalid = SettingRule.super.problemOf(value, stored);
		if (invalid.isPresent()) {
			return invalid;
		}
		Map<String, String> storedIssuerUrls = issuerUrlsOf(stored);
		for (Object provider : (List<?>) value) {
			Map<?, ?> fields = (Map<?, ?>) provider;
			String id = (String) fields.get(OidcProviders.ID);
			String issuerUrl = (String) fields.get(OidcProviders.ISSUER_URL);
			if (!issuerUrl.equals(storedIssuerUrls.get(id))) {
				try {
					discovery.discover(id, issuerUrl);
				}
				catch (NoDiscoveryDocumentException ex) {
					log.info("The change of the OIDC providers is refused: " + ex.getMessage());
					return Optional.of(NO_DISCOVERY_DOCUMENT);
				}
			}
		}
		return Optional.empty();
	}

	/** The issuer URL of each stored OIDC provider by its provider ID; an item of another form is ignored. */
	private static Map<String, String> issuerUrlsOf(Object stored) {
		Map<String, String> issuerUrls = new HashMap<>();
		if (stored instanceof List<?> items) {
			for (Object item : items) {
				if (item instanceof Map<?, ?> fields && fields.get(OidcProviders.ID) instanceof String id
						&& fields.get(OidcProviders.ISSUER_URL) instanceof String issuerUrl) {
					issuerUrls.put(id, issuerUrl);
				}
			}
		}
		return issuerUrls;
	}

}
