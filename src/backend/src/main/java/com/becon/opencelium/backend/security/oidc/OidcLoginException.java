package com.becon.opencelium.backend.security.oidc;

import org.springframework.security.core.AuthenticationException;

public class OidcLoginException extends AuthenticationException {

    private final String code;

    public OidcLoginException(String code, String message) {
        super(message);
        this.code = code;
    }

    public OidcLoginException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
