package com.becon.opencelium.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component
public class TotpAuthenticationFilter extends AuthenticationFilter {
    public TotpAuthenticationFilter() {
        setFilterProcessesUrl("/totp-validate");
    }

    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
        // Ensure the request method is POST
        if (!request.getMethod().equals("POST")) {
            throw new AuthenticationServiceException("Authentication method not supported: " + request.getMethod());
        }
        // TODO: Extract user session that contains secret

        // Extract the TOTP code from the request
        String totpCode = obtainTotpCode(request);

        // Validate the TOTP code
        if (!isValidTotp(totpCode)) {
            throw new AuthenticationServiceException("Invalid TOTP code");
        }

        // If the TOTP code is valid, proceed with the authentication chain
        return super.attemptAuthentication(request, response);
    }

    private String obtainTotpCode(HttpServletRequest request) {
        // TODO: implement functionality that obtains totp code from request
        return null;
    }

    private boolean isValidTotp(String totpCode) {
        // TODO: Implement your TOTP validation logic here
        return true;
    }
}
