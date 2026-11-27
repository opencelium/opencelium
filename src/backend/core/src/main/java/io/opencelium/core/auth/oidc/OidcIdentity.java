package io.opencelium.core.auth.oidc;

/**
 * The person that a checked ID token names: the claims that core uses to find or make its OpenCelium user.
 *
 * @param issuer        the claim {@code iss}, the issuer URL of the OIDC provider
 * @param subject       the claim {@code sub}, the account of the person at the IdP
 * @param email         the claim {@code email}, or {@code null} when the ID token has none
 * @param emailVerified the claim {@code email_verified}; {@code false} when the ID token has none
 */
public record OidcIdentity(String issuer, String subject, String email, boolean emailVerified) {

}
