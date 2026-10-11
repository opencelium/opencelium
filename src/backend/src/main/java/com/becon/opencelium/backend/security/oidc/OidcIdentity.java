package com.becon.opencelium.backend.security.oidc;

import java.util.List;
import java.util.Map;

/**
 * Verified identity of a user returned by the identity provider. Produced by the callback
 * endpoint, handed to the authentication provider through a one-time ticket. 'issuer' together with
 * 'subject' is what an OpenCelium account is linked to, so that a login is never matched by email
 * alone unless weak matching was switched on deliberately.
 */
public record OidcIdentity(String issuer, String subject, String email, List<String> groups, Map<String, Object> claims) {
}
