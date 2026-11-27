package io.opencelium.core.auth.oidc;

/**
 * An issuer URL without an OIDC discovery document: the issuer URL has no HTTPS, the IdP does not answer within the
 * limits of a call, or its answer is not the discovery document of the issuer URL. The message names the provider
 * ID and a fixed reason, and never a part of the answer of the IdP. The exception has no cause, because the message
 * of an exception of the HTTP client or of the JSON parser can quote the answer.
 */
public final class NoDiscoveryDocumentException extends RuntimeException {

	/**
	 * @param providerId the provider ID of the OIDC provider
	 * @param reason     a fixed text that says why the IdP has no discovery document; it holds no part of the answer
	 */
	NoDiscoveryDocumentException(String providerId, String reason) {
		super("The OIDC provider " + providerId + " has no usable discovery document: " + reason + ".");
	}

}
