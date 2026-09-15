package com.becon.opencelium.backend.security.oidc;

/**
 * Values that must survive the round trip to the identity provider. Stored in a signed cookie
 * because the session policy is STATELESS.
 */
public record OidcAuthorizationState(String state, String nonce, String codeVerifier, String redirectUri,
                                     long expiresAt) {
}
