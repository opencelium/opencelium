package io.opencelium.core.auth.oidc;

/**
 * The ID token of the answer of the IdP is not valid for the login: a wrong issuer, audience, signature or nonce, or
 * an ID token that expired. The message names the provider ID and a fixed reason, and never the ID token.
 */
public final class InvalidIdTokenException extends RuntimeException {

	/**
	 * @param providerId the provider ID of the OIDC provider
	 * @param reason     a fixed text that says why core refuses the ID token; it holds no part of the ID token
	 */
	InvalidIdTokenException(String providerId, String reason) {
		super("The ID token for the OIDC provider " + providerId + " is not valid: " + reason + ".");
	}

}
