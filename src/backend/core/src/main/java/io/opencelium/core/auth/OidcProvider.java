package io.opencelium.core.auth;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import io.opencelium.common.secret.SecretReference;

/**
 * An OIDC provider of the setting, with the values that the endpoints of a login use.
 *
 * @param issuerUrl    the issuer URL of the IdP
 * @param clientId     the client ID of core at the IdP
 * @param clientSecret the reference of the client secret in the secret storage, never the client secret; {@code null}
 *                     when the item has none
 */
record OidcProvider(String issuerUrl, String clientId, SecretReference clientSecret) {

	/**
	 * @param items      the items of the setting of the OIDC providers
	 * @param providerId the provider ID of the item
	 * @return the OIDC provider of the item with the provider ID; an item without text for the issuer URL and the client
	 *         ID has no use
	 */
	static Optional<OidcProvider> find(List<Map<String, Object>> items, String providerId) {
		for (Map<String, Object> item : items) {
			if (providerId.equals(item.get(OidcProviders.ID)) && item.get(OidcProviders.ISSUER_URL) instanceof String
					issuerUrl && item.get(OidcProviders.CLIENT_ID) instanceof String clientId) {
				SecretReference clientSecret = item.get(OidcProviders.CLIENT_SECRET) instanceof SecretReference reference
						? reference : null;
				return Optional.of(new OidcProvider(issuerUrl, clientId, clientSecret));
			}
		}
		return Optional.empty();
	}

}
