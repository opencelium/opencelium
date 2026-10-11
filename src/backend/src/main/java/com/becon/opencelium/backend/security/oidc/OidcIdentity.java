package com.becon.opencelium.backend.security.oidc;

import java.util.List;

/**
 * Verified identity of a user returned by the identity provider. Produced by the callback
 * endpoint, handed to the authentication provider through a one-time ticket.
 *
 * It carries only what the rest of the login needs. 'issuer' together with 'subject' is what an
 * OpenCelium account is linked to, so a login is never matched by email alone unless weak matching was
 * switched on deliberately. The raw claims stay in {@link OidcLoginServiceImpl}, which derives these
 * fields from them: the identity is stored in the ticket row, so keeping the claims would persist
 * every claim the provider happens to send.
 */
public record OidcIdentity(String issuer, String subject, String email, List<String> groups) {
}
