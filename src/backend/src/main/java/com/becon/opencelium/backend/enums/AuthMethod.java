package com.becon.opencelium.backend.enums;

public enum AuthMethod {
    LDAP, BASIC, OIDC;

    public boolean isPasswordManagedExternally() {
        return this == LDAP || this == OIDC;
    }
}
