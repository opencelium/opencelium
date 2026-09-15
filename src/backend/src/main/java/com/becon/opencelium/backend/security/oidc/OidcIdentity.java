package com.becon.opencelium.backend.security.oidc;

import java.util.List;
import java.util.Map;

/**
 * Verified identity of a user returned by the identity provider. Produced by the callback
 * endpoint, handed to the authentication provider through a one-time ticket.
 */
public record OidcIdentity(String subject, String email, List<String> groups, Map<String, Object> claims) {
}
