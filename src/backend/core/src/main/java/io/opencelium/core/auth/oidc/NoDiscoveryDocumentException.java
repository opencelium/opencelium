package io.opencelium.core.auth.oidc;

/**
 * An issuer URL without an OIDC discovery document: the issuer URL has no HTTPS, the IdP does not answer within the
 * limits of a call, or its answer is not the discovery document of the issuer URL. The message names the provider
 * ID and never the body of an answer of the IdP.
 */
public final class NoDiscoveryDocumentException extends RuntimeException {

}
