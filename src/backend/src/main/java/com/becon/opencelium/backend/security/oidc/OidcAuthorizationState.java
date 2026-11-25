package com.becon.opencelium.backend.security.oidc;

/**
 * Values that must survive the round trip to the identity provider. Stored in a signed cookie
 * because the session policy is STATELESS.
 *
 * 'clientNonceHash' binds the login to the browser that started it: the frontend keeps the nonce
 * itself and has to present it when it trades the one-time ticket for a session, so a ticket can
 * not be handed to somebody else's browser.
 */
public record OidcAuthorizationState(String state, String nonce, String codeVerifier, String redirectUri,
                                     String clientNonceHash, long expiresAt) {
}
