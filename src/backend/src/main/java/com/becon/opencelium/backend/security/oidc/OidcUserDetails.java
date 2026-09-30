package com.becon.opencelium.backend.security.oidc;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * Principal produced by {@link OidcAuthenticationProvider}. Carries the raw group names of the
 * identity provider as authorities, the way LdapUserDetails carries group DNs, so that
 * AuthenticationFilter can resolve the OpenCelium role for the user.
 */
public class OidcUserDetails implements UserDetails {

    private final OidcIdentity identity;

    public OidcUserDetails(OidcIdentity identity) {
        this.identity = identity;
    }

    public String getEmail() {
        return identity.email();
    }

    public String getSubject() {
        return identity.subject();
    }

    public Map<String, Object> getClaims() {
        return identity.claims();
    }

    public List<String> getGroups() {
        return identity.groups();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return identity.groups().stream()
                .map(SimpleGrantedAuthority::new)
                .toList();
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return identity.email();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
