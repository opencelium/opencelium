package io.opencelium.core.auth.oidc;

/**
 * The values of 1 OIDC login that the exchange of the code of the IdP needs, without the code and without the client
 * secret: the token request sends the code, the redirect URI and the PKCE verifier, and the ID token of the answer
 * must have the issuer of the discovery document, the client ID as its audience, and the nonce.
 *
 * @param providerId   the provider ID of the OIDC provider, for the message of an error
 * @param document     the discovery document of the IdP: its issuer, its token endpoint and the address of its keys
 * @param clientId     the client ID of core at the IdP
 * @param redirectUri  the redirect URI of the authorization request; the token request must send the same one
 * @param codeVerifier the PKCE verifier of the authorization request
 * @param nonce        the nonce of the authorization request, which the ID token must have
 */
public record OidcTokenRequest(String providerId, OidcDiscoveryDocument document, String clientId,
		String redirectUri, String codeVerifier, String nonce) {

	/** Without the PKCE verifier and the nonce: no log line and no error message shows them. */
	@Override
	public String toString() {
		return "OidcTokenRequest[providerId=" + providerId + ", clientId=" + clientId + ", redirectUri=" + redirectUri
				+ ", codeVerifier=****, nonce=****]";
	}

}
