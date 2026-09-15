package com.becon.opencelium.backend.security.oidc;

import org.springframework.security.authentication.AbstractAuthenticationToken;

/**
 * Authentication request carrying the one-time ticket issued by the OIDC callback endpoint.
 */
public class OidcAuthenticationToken extends AbstractAuthenticationToken {

    private final String ticket;

    public OidcAuthenticationToken(String ticket) {
        super(null);
        this.ticket = ticket;
    }

    @Override
    public Object getCredentials() {
        return ticket;
    }

    @Override
    public Object getPrincipal() {
        return ticket;
    }
}
