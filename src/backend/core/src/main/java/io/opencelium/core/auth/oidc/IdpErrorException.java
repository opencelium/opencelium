package io.opencelium.core.auth.oidc;

/**
 * The IdP gives no usable answer to the token request or to the request of its public keys: the address has no HTTPS,
 * the IdP does not answer within the limits of a call, or its answer is an error, a redirect or too long. The message
 * names the provider ID and a fixed reason, and never a part of the answer of the IdP.
 */
public final class IdpErrorException extends RuntimeException {

	/**
	 * @param providerId the provider ID of the OIDC provider
	 * @param reason     a fixed text that says why the call failed; it holds no part of the answer
	 */
	IdpErrorException(String providerId, String reason) {
		super("The IdP of the OIDC provider " + providerId + " gave no usable answer: " + reason + ".");
	}

}
