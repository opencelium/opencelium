package com.becon.opencelium.backend.security;

import com.becon.opencelium.backend.resource.OidcTicketDTO;
import com.becon.opencelium.backend.security.oidc.OidcAuthenticationToken;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Exchanges the one-time ticket handed to the frontend by /oidc/callback for an OpenCelium
 * session. Extends AuthenticationFilter so that the inherited successfulAuthentication keeps
 * minting the JWT, rotating the session and running the TOTP branch, the same way
 * TotpAuthenticationFilter does for /totp-validate.
 */
@Component
public class OidcAuthenticationFilter extends AuthenticationFilter {

    public OidcAuthenticationFilter() {
        setFilterProcessesUrl("/oidc/exchange");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) {
        if (!request.getMethod().equals("POST")) {
            throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
        }

        try {
            OidcTicketDTO dto = new ObjectMapper()
                    .readValue(request.getInputStream(), OidcTicketDTO.class);

            return getAuthenticationManager().authenticate(new OidcAuthenticationToken(dto.code()));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
