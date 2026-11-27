package io.opencelium.core.auth.oidc;

import java.net.URI;

/**
 * The OIDC discovery document of an IdP: the parts that core uses.
 *
 * @param issuer                the issuer, which is the issuer URL of the OIDC provider
 * @param authorizationEndpoint the address of the login page of the IdP, for the authorization request
 * @param tokenEndpoint         the address of the token request
 * @param jwksUri               the address of the public keys of the IdP, for the check of an ID token
 */
public record OidcDiscoveryDocument(String issuer, URI authorizationEndpoint, URI tokenEndpoint, URI jwksUri) {

}
