package com.becon.opencelium.backend.security.oidc;

import org.springframework.security.authentication.AbstractAuthenticationToken;

/**
 * Authentication request carrying the one-time ticket issued by the OIDC callback endpoint, together
 * with the client nonce the browser that started the login kept. Both are needed: the nonce is what
 * proves the ticket is being spent by that browser and not by whoever obtained the code.
 */
public class OidcAuthenticationToken extends AbstractAuthenticationToken {

    private final String ticket;
    private final String clientNonce;

    public OidcAuthenticationToken(String ticket, String clientNonce) {
        super(null);
        this.ticket = ticket;
        this.clientNonce = clientNonce;
    }

    public String getTicket() {
        return ticket;
    }

    public String getClientNonce() {
        return clientNonce;
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
