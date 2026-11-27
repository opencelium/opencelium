package io.opencelium.core.auth.oidc;

import org.springframework.http.client.ClientHttpRequestFactory;

/**
 * Reads the OIDC discovery document of an issuer URL. Each call has HTTPS only, a timeout, a size limit and no
 * redirect, and an error names the provider ID and never the body of an answer of the IdP.
 */
public final class OidcDiscovery {

	/**
	 * @param requestFactory the HTTP client of the calls to an IdP, with the timeout and without a redirect
	 */
	public OidcDiscovery(ClientHttpRequestFactory requestFactory) {
		throw new UnsupportedOperationException("The discovery of an IdP is not implemented yet.");
	}

	/**
	 * @param providerId the provider ID, for the message of an error
	 * @param issuerUrl  the issuer URL of the OIDC provider
	 * @return the discovery document, whose issuer is the issuer URL
	 * @throws NoDiscoveryDocumentException when the issuer URL has no HTTPS, or the IdP gives no discovery document
	 *                                      of the issuer URL within the limits of a call
	 */
	public OidcDiscoveryDocument discover(String providerId, String issuerUrl) {
		throw new UnsupportedOperationException("The discovery of an IdP is not implemented yet.");
	}

}
